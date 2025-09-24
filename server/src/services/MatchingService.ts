import { createClient } from '@supabase/supabase-js';
import { RedisService } from './RedisService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import type { MatchingPreferences, MatchResult } from '../types/matching';

export class MatchingService {
  private supabase;
  private redis: RedisService;

  constructor(redisService: RedisService) {
    this.redis = redisService;
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async joinQueue(
    userId: string,
    preferences: MatchingPreferences,
    priority: boolean = false
  ): Promise<number> {
    try {
      // Remove user from any existing queue first
      await this.leaveQueue(userId);

      // Add to database for persistence
      await this.updateUserQueueStatus(userId, preferences, true);

      // Add to Redis queue
      const position = priority
        ? await this.redis.addToQueueWithPriority(userId, preferences)
        : await this.redis.addToQueue(userId, preferences);

      logger.info(`User ${userId} joined queue at position ${position}`);
      return position;
    } catch (error) {
      logger.error(`Error joining queue for user ${userId}:`, error);
      throw new Error('Failed to join queue');
    }
  }

  async leaveQueue(userId: string): Promise<void> {
    try {
      // Remove from Redis
      await this.redis.removeFromQueue(userId);

      // Update database status
      await this.updateUserQueueStatus(userId, null, false);

      logger.info(`User ${userId} left the queue`);
    } catch (error) {
      logger.error(`Error leaving queue for user ${userId}:`, error);
      throw new Error('Failed to leave queue');
    }
  }

  async findMatch(userId: string, preferences: MatchingPreferences): Promise<MatchResult | null> {
    try {
      // Progressive matching algorithm with fallbacks
      let match = await this.findExactMatch(userId, preferences);

      if (!match) {
        // Fallback 1: Remove proficiency requirement
        match = await this.findMatchWithoutProficiency(userId, preferences);
      }

      if (!match) {
        // Fallback 2: Expand age range
        match = await this.findMatchWithExpandedAge(userId, preferences);
      }

      if (!match) {
        // Fallback 3: Remove gender preference
        match = await this.findMatchWithoutGender(userId, preferences);
      }

      if (!match) {
        // Fallback 4: Language-only matching
        match = await this.findLanguageOnlyMatch(userId, preferences);
      }

      if (match) {
        // Create session and remove both users from queue
        const sessionId = await this.createSession(userId, match.userId);

        // Remove both users from their respective queues
        await this.leaveQueue(userId);
        await this.leaveQueue(match.userId);

        // Create match record in Redis
        await this.redis.createMatch(userId, match.userId, sessionId);

        return {
          id: uuidv4(),
          user1_id: userId,
          user2_id: match.userId,
          session_id: sessionId,
          compatibility_score: match.compatibilityScore || 0.8,
        };
      }

      return null;
    } catch (error) {
      logger.error(`Error finding match for user ${userId}:`, error);
      throw new Error('Failed to find match');
    }
  }

  async acceptMatch(userId: string, matchId: string): Promise<boolean> {
    try {
      // This would typically involve updating the match status in the database
      // For now, we'll use Redis to track acceptance
      const accepted = await this.redis.acceptMatch(userId, matchId);

      if (accepted) {
        logger.info(`Match ${matchId} fully accepted by both users`);
      }

      return accepted;
    } catch (error) {
      logger.error(`Error accepting match ${matchId} for user ${userId}:`, error);
      throw new Error('Failed to accept match');
    }
  }

  async rejectMatch(userId: string, matchId: string): Promise<void> {
    try {
      await this.redis.rejectMatch(userId, matchId);
      logger.info(`Match ${matchId} rejected by user ${userId}`);
    } catch (error) {
      logger.error(`Error rejecting match ${matchId} for user ${userId}:`, error);
      throw new Error('Failed to reject match');
    }
  }

  async getEstimatedWaitTime(preferences: MatchingPreferences): Promise<number> {
    try {
      const queueLength = await this.redis.getQueueLength(
        preferences.native_language,
        preferences.target_language
      );

      // Simple estimation: average 30 seconds per match + queue position
      const baseWaitTime = 30; // seconds
      const estimatedWait = queueLength * baseWaitTime;

      return Math.min(estimatedWait, 300); // Cap at 5 minutes
    } catch (error) {
      logger.error('Error calculating wait time:', error);
      return 60; // Default to 1 minute
    }
  }

  async getUserPreferences(userId: string): Promise<MatchingPreferences | null> {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select('native_language, target_languages, age, gender, proficiency_levels')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error(`Error fetching user preferences for ${userId}:`, error);
        return null;
      }

      if (!user) {
        return null;
      }

      // Convert to MatchingPreferences format
      return {
        userId,
        native_language: user.native_language,
        target_language: user.target_languages[0], // Use first target language
        age: user.age,
        gender: user.gender,
        proficiency_level: user.proficiency_levels?.[user.target_languages[0]] || 'beginner',
        age_min: Math.max(16, user.age - 10),
        age_max: user.age + 10,
        gender_preference: 'any', // Could be stored in user preferences
      };
    } catch (error) {
      logger.error(`Error getting user preferences for ${userId}:`, error);
      return null;
    }
  }

  async cleanupStaleConnections(): Promise<void> {
    try {
      await this.redis.cleanupStaleConnections();

      // Also cleanup database queue entries
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      await this.supabase
        .from('matching_queue')
        .delete()
        .lt('last_ping', fiveMinutesAgo.toISOString());

      logger.info('Completed stale connection cleanup');
    } catch (error) {
      logger.error('Error in cleanup task:', error);
    }
  }

  // Private helper methods
  private async findExactMatch(
    userId: string,
    preferences: MatchingPreferences
  ): Promise<{ userId: string; compatibilityScore?: number } | null> {
    const compatibleUsers = await this.redis.findCompatibleUsersInQueue(preferences, 5);

    for (const candidate of compatibleUsers) {
      if (this.isExactMatch(preferences, candidate.preferences)) {
        return {
          userId: candidate.userId,
          compatibilityScore: this.calculateCompatibilityScore(preferences, candidate.preferences),
        };
      }
    }

    return null;
  }

  private async findMatchWithoutProficiency(
    userId: string,
    preferences: MatchingPreferences
  ): Promise<{ userId: string; compatibilityScore?: number } | null> {
    const { proficiency_level, ...relaxedPrefs } = preferences;

    const compatibleUsers = await this.redis.findCompatibleUsersInQueue(relaxedPrefs, 10);

    if (compatibleUsers.length > 0) {
      const candidate = compatibleUsers[0];
      if (candidate) {
        return {
          userId: candidate.userId,
          compatibilityScore: this.calculateCompatibilityScore(preferences, candidate.preferences),
        };
      }
    }

    return null;
  }

  private async findMatchWithExpandedAge(
    userId: string,
    preferences: MatchingPreferences
  ): Promise<{ userId: string; compatibilityScore?: number } | null> {
    const expandedPrefs = {
      ...preferences,
      age_min: Math.max(16, (preferences.age_min || 18) - 5),
      age_max: (preferences.age_max || 65) + 5,
    };

    const compatibleUsers = await this.redis.findCompatibleUsersInQueue(expandedPrefs, 15);

    if (compatibleUsers.length > 0) {
      const candidate = compatibleUsers[0];
      if (candidate) {
        return {
          userId: candidate.userId,
          compatibilityScore: this.calculateCompatibilityScore(preferences, candidate.preferences),
        };
      }
    }

    return null;
  }

  private async findMatchWithoutGender(
    userId: string,
    preferences: MatchingPreferences
  ): Promise<{ userId: string; compatibilityScore?: number } | null> {
    const { gender_preference, ...genderNeutralPrefs } = preferences;

    const compatibleUsers = await this.redis.findCompatibleUsersInQueue(genderNeutralPrefs, 20);

    if (compatibleUsers.length > 0) {
      const candidate = compatibleUsers[0];
      if (candidate) {
        return {
          userId: candidate.userId,
          compatibilityScore: this.calculateCompatibilityScore(preferences, candidate.preferences),
        };
      }
    }

    return null;
  }

  private async findLanguageOnlyMatch(
    userId: string,
    preferences: MatchingPreferences
  ): Promise<{ userId: string; compatibilityScore?: number } | null> {
    const languageOnlyPrefs = {
      userId: preferences.userId,
      native_language: preferences.native_language,
      target_language: preferences.target_language,
    } as MatchingPreferences;

    const compatibleUsers = await this.redis.findCompatibleUsersInQueue(languageOnlyPrefs, 25);

    if (compatibleUsers.length > 0) {
      const candidate = compatibleUsers[0];
      if (candidate) {
        return {
          userId: candidate.userId,
          compatibilityScore: 0.5, // Lower score for language-only match
        };
      }
    }

    return null;
  }

  private isExactMatch(userPrefs: MatchingPreferences, candidatePrefs: MatchingPreferences): boolean {
    return (
      userPrefs.proficiency_level === candidatePrefs.proficiency_level &&
      userPrefs.age >= (candidatePrefs.age_min || 16) &&
      userPrefs.age <= (candidatePrefs.age_max || 100) &&
      candidatePrefs.age >= (userPrefs.age_min || 16) &&
      candidatePrefs.age <= (userPrefs.age_max || 100) &&
      (!userPrefs.gender_preference || userPrefs.gender_preference === 'any' || candidatePrefs.gender === userPrefs.gender_preference) &&
      (!candidatePrefs.gender_preference || candidatePrefs.gender_preference === 'any' || userPrefs.gender === candidatePrefs.gender_preference)
    );
  }

  private calculateCompatibilityScore(
    userPrefs: MatchingPreferences,
    candidatePrefs: MatchingPreferences
  ): number {
    let score = 0.5; // Base score

    // Language pair match (most important)
    if (userPrefs.native_language === candidatePrefs.target_language &&
        userPrefs.target_language === candidatePrefs.native_language) {
      score += 0.3;
    }

    // Proficiency level compatibility
    if (userPrefs.proficiency_level === candidatePrefs.proficiency_level) {
      score += 0.1;
    }

    // Age compatibility
    const ageDiff = Math.abs(userPrefs.age - candidatePrefs.age);
    if (ageDiff <= 5) {
      score += 0.1;
    } else if (ageDiff <= 10) {
      score += 0.05;
    }

    // Gender preference match
    if ((!userPrefs.gender_preference || userPrefs.gender_preference === 'any' || candidatePrefs.gender === userPrefs.gender_preference) &&
        (!candidatePrefs.gender_preference || candidatePrefs.gender_preference === 'any' || userPrefs.gender === candidatePrefs.gender_preference)) {
      score += 0.05;
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  private async createSession(user1Id: string, user2Id: string): Promise<string> {
    const sessionId = uuidv4();

    try {
      const { error } = await this.supabase
        .from('sessions')
        .insert({
          id: sessionId,
          user1_id: user1Id,
          user2_id: user2Id,
          started_at: new Date().toISOString(),
          session_status: 'active',
        });

      if (error) {
        logger.error('Error creating session:', error);
        throw error;
      }

      return sessionId;
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw new Error('Failed to create session');
    }
  }

  private async updateUserQueueStatus(
    userId: string,
    preferences: MatchingPreferences | null,
    inQueue: boolean
  ): Promise<void> {
    try {
      if (inQueue && preferences) {
        // Add or update queue entry
        await this.supabase
          .from('matching_queue')
          .upsert({
            user_id: userId,
            native_language: preferences.native_language,
            target_language: preferences.target_language,
            preferred_age_min: preferences.age_min,
            preferred_age_max: preferences.age_max,
            preferred_gender: preferences.gender_preference,
            queue_position: 0, // Will be updated by Redis
            entered_at: new Date().toISOString(),
            last_ping: new Date().toISOString(),
          });
      } else {
        // Remove from queue
        await this.supabase
          .from('matching_queue')
          .delete()
          .eq('user_id', userId);
      }
    } catch (error) {
      logger.error('Error updating user queue status:', error);
      // Don't throw here as Redis operations are more important
    }
  }
}