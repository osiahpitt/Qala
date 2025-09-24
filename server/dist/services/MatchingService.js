"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
class MatchingService {
    constructor(redisService) {
        this.redis = redisService;
        this.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
    async joinQueue(userId, preferences, priority = false) {
        try {
            await this.leaveQueue(userId);
            await this.updateUserQueueStatus(userId, preferences, true);
            const position = priority
                ? await this.redis.addToQueueWithPriority(userId, preferences)
                : await this.redis.addToQueue(userId, preferences);
            logger_1.logger.info(`User ${userId} joined queue at position ${position}`);
            return position;
        }
        catch (error) {
            logger_1.logger.error(`Error joining queue for user ${userId}:`, error);
            throw new Error('Failed to join queue');
        }
    }
    async leaveQueue(userId) {
        try {
            await this.redis.removeFromQueue(userId);
            await this.updateUserQueueStatus(userId, null, false);
            logger_1.logger.info(`User ${userId} left the queue`);
        }
        catch (error) {
            logger_1.logger.error(`Error leaving queue for user ${userId}:`, error);
            throw new Error('Failed to leave queue');
        }
    }
    async findMatch(userId, preferences) {
        try {
            let match = await this.findExactMatch(userId, preferences);
            if (!match) {
                match = await this.findMatchWithoutProficiency(userId, preferences);
            }
            if (!match) {
                match = await this.findMatchWithExpandedAge(userId, preferences);
            }
            if (!match) {
                match = await this.findMatchWithoutGender(userId, preferences);
            }
            if (!match) {
                match = await this.findLanguageOnlyMatch(userId, preferences);
            }
            if (match) {
                const sessionId = await this.createSession(userId, match.userId);
                await this.leaveQueue(userId);
                await this.leaveQueue(match.userId);
                await this.redis.createMatch(userId, match.userId, sessionId);
                return {
                    id: (0, uuid_1.v4)(),
                    user1_id: userId,
                    user2_id: match.userId,
                    session_id: sessionId,
                    compatibility_score: match.compatibilityScore || 0.8,
                };
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error(`Error finding match for user ${userId}:`, error);
            throw new Error('Failed to find match');
        }
    }
    async acceptMatch(userId, matchId) {
        try {
            const accepted = await this.redis.acceptMatch(userId, matchId);
            if (accepted) {
                logger_1.logger.info(`Match ${matchId} fully accepted by both users`);
            }
            return accepted;
        }
        catch (error) {
            logger_1.logger.error(`Error accepting match ${matchId} for user ${userId}:`, error);
            throw new Error('Failed to accept match');
        }
    }
    async rejectMatch(userId, matchId) {
        try {
            await this.redis.rejectMatch(userId, matchId);
            logger_1.logger.info(`Match ${matchId} rejected by user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error rejecting match ${matchId} for user ${userId}:`, error);
            throw new Error('Failed to reject match');
        }
    }
    async getEstimatedWaitTime(preferences) {
        try {
            const queueLength = await this.redis.getQueueLength(preferences.native_language, preferences.target_language);
            const baseWaitTime = 30;
            const estimatedWait = queueLength * baseWaitTime;
            return Math.min(estimatedWait, 300);
        }
        catch (error) {
            logger_1.logger.error('Error calculating wait time:', error);
            return 60;
        }
    }
    async getUserPreferences(userId) {
        try {
            const { data: user, error } = await this.supabase
                .from('users')
                .select('native_language, target_languages, age, gender, proficiency_levels')
                .eq('id', userId)
                .single();
            if (error) {
                logger_1.logger.error(`Error fetching user preferences for ${userId}:`, error);
                return null;
            }
            if (!user) {
                return null;
            }
            return {
                userId,
                native_language: user.native_language,
                target_language: user.target_languages[0],
                age: user.age,
                gender: user.gender,
                proficiency_level: user.proficiency_levels?.[user.target_languages[0]] || 'beginner',
                age_min: Math.max(16, user.age - 10),
                age_max: user.age + 10,
                gender_preference: 'any',
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting user preferences for ${userId}:`, error);
            return null;
        }
    }
    async cleanupStaleConnections() {
        try {
            await this.redis.cleanupStaleConnections();
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            await this.supabase
                .from('matching_queue')
                .delete()
                .lt('last_ping', fiveMinutesAgo.toISOString());
            logger_1.logger.info('Completed stale connection cleanup');
        }
        catch (error) {
            logger_1.logger.error('Error in cleanup task:', error);
        }
    }
    async findExactMatch(userId, preferences) {
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
    async findMatchWithoutProficiency(userId, preferences) {
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
    async findMatchWithExpandedAge(userId, preferences) {
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
    async findMatchWithoutGender(userId, preferences) {
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
    async findLanguageOnlyMatch(userId, preferences) {
        const languageOnlyPrefs = {
            userId: preferences.userId,
            native_language: preferences.native_language,
            target_language: preferences.target_language,
        };
        const compatibleUsers = await this.redis.findCompatibleUsersInQueue(languageOnlyPrefs, 25);
        if (compatibleUsers.length > 0) {
            const candidate = compatibleUsers[0];
            if (candidate) {
                return {
                    userId: candidate.userId,
                    compatibilityScore: 0.5,
                };
            }
        }
        return null;
    }
    isExactMatch(userPrefs, candidatePrefs) {
        return (userPrefs.proficiency_level === candidatePrefs.proficiency_level &&
            userPrefs.age >= (candidatePrefs.age_min || 16) &&
            userPrefs.age <= (candidatePrefs.age_max || 100) &&
            candidatePrefs.age >= (userPrefs.age_min || 16) &&
            candidatePrefs.age <= (userPrefs.age_max || 100) &&
            (!userPrefs.gender_preference || userPrefs.gender_preference === 'any' || candidatePrefs.gender === userPrefs.gender_preference) &&
            (!candidatePrefs.gender_preference || candidatePrefs.gender_preference === 'any' || userPrefs.gender === candidatePrefs.gender_preference));
    }
    calculateCompatibilityScore(userPrefs, candidatePrefs) {
        let score = 0.5;
        if (userPrefs.native_language === candidatePrefs.target_language &&
            userPrefs.target_language === candidatePrefs.native_language) {
            score += 0.3;
        }
        if (userPrefs.proficiency_level === candidatePrefs.proficiency_level) {
            score += 0.1;
        }
        const ageDiff = Math.abs(userPrefs.age - candidatePrefs.age);
        if (ageDiff <= 5) {
            score += 0.1;
        }
        else if (ageDiff <= 10) {
            score += 0.05;
        }
        if ((!userPrefs.gender_preference || userPrefs.gender_preference === 'any' || candidatePrefs.gender === userPrefs.gender_preference) &&
            (!candidatePrefs.gender_preference || candidatePrefs.gender_preference === 'any' || userPrefs.gender === candidatePrefs.gender_preference)) {
            score += 0.05;
        }
        return Math.min(score, 1.0);
    }
    async createSession(user1Id, user2Id) {
        const sessionId = (0, uuid_1.v4)();
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
                logger_1.logger.error('Error creating session:', error);
                throw error;
            }
            return sessionId;
        }
        catch (error) {
            logger_1.logger.error('Failed to create session:', error);
            throw new Error('Failed to create session');
        }
    }
    async updateUserQueueStatus(userId, preferences, inQueue) {
        try {
            if (inQueue && preferences) {
                await this.supabase
                    .from('matching_queue')
                    .upsert({
                    user_id: userId,
                    native_language: preferences.native_language,
                    target_language: preferences.target_language,
                    preferred_age_min: preferences.age_min,
                    preferred_age_max: preferences.age_max,
                    preferred_gender: preferences.gender_preference,
                    queue_position: 0,
                    entered_at: new Date().toISOString(),
                    last_ping: new Date().toISOString(),
                });
            }
            else {
                await this.supabase
                    .from('matching_queue')
                    .delete()
                    .eq('user_id', userId);
            }
        }
        catch (error) {
            logger_1.logger.error('Error updating user queue status:', error);
        }
    }
}
exports.MatchingService = MatchingService;
//# sourceMappingURL=MatchingService.js.map