import Redis from 'ioredis';
import { logger } from '../utils/logger';
import type { MatchingPreferences, QueueEntry } from '../types/matching';

export class RedisService {
  private redis: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.subscriber = new Redis(redisUrl, {
      lazyConnect: true,
    });

    this.publisher = new Redis(redisUrl, {
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      logger.info('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
  }

  async connect(): Promise<void> {
    await this.redis.connect();
    await this.subscriber.connect();
    await this.publisher.connect();
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
    await this.subscriber.disconnect();
    await this.publisher.disconnect();
  }

  // Queue operations with atomic transactions
  async addToQueue(userId: string, preferences: MatchingPreferences): Promise<number> {
    const queueKey = this.getQueueKey(preferences.native_language, preferences.target_language);
    const timestamp = Date.now();

    const entry: QueueEntry = {
      userId,
      preferences,
      timestamp,
      priority: false,
    };

    // Use Redis sorted set with timestamp as score for FIFO ordering
    const pipeline = this.redis.pipeline();
    pipeline.zadd(queueKey, timestamp, JSON.stringify(entry));
    pipeline.hset(`user:${userId}:queue`, {
      queueKey,
      timestamp,
      preferences: JSON.stringify(preferences),
    });

    await pipeline.exec();

    // Get queue position (0-indexed)
    const position = await this.redis.zrank(queueKey, JSON.stringify(entry));
    return (position || 0) + 1; // Return 1-indexed position
  }

  async removeFromQueue(userId: string): Promise<void> {
    // Get user's current queue info
    const userQueue = await this.redis.hgetall(`user:${userId}:queue`);

    if (userQueue.queueKey && userQueue.preferences && userQueue.timestamp) {
      const entry: QueueEntry = {
        userId,
        preferences: JSON.parse(userQueue.preferences),
        timestamp: parseInt(userQueue.timestamp),
        priority: false,
      };

      // Remove from queue
      await this.redis.zrem(userQueue.queueKey, JSON.stringify(entry));
    }

    // Clean up user queue data
    await this.redis.del(`user:${userId}:queue`);
  }

  async addToQueueWithPriority(userId: string, preferences: MatchingPreferences): Promise<number> {
    const queueKey = this.getQueueKey(preferences.native_language, preferences.target_language);
    const timestamp = Date.now() - 10000; // Subtract 10 seconds for priority

    const entry: QueueEntry = {
      userId,
      preferences,
      timestamp,
      priority: true,
    };

    const pipeline = this.redis.pipeline();
    pipeline.zadd(queueKey, timestamp, JSON.stringify(entry));
    pipeline.hset(`user:${userId}:queue`, {
      queueKey,
      timestamp,
      preferences: JSON.stringify(preferences),
      priority: 'true',
    });

    await pipeline.exec();

    const position = await this.redis.zrank(queueKey, JSON.stringify(entry));
    return (position || 0) + 1;
  }

  async getQueuePosition(userId: string): Promise<number | null> {
    const userQueue = await this.redis.hgetall(`user:${userId}:queue`);

    if (!userQueue.queueKey || !userQueue.preferences || !userQueue.timestamp) {
      return null;
    }

    const entry: QueueEntry = {
      userId,
      preferences: JSON.parse(userQueue.preferences),
      timestamp: parseInt(userQueue.timestamp),
      priority: userQueue.priority === 'true',
    };

    const position = await this.redis.zrank(userQueue.queueKey, JSON.stringify(entry));
    return position !== null ? position + 1 : null;
  }

  async getQueueLength(nativeLanguage: string, targetLanguage: string): Promise<number> {
    const queueKey = this.getQueueKey(nativeLanguage, targetLanguage);
    return await this.redis.zcard(queueKey);
  }

  async findCompatibleUsersInQueue(
    preferences: MatchingPreferences,
    limit: number = 10
  ): Promise<QueueEntry[]> {
    // Primary queue: exact language pair match
    const primaryQueueKey = this.getQueueKey(preferences.target_language, preferences.native_language);

    // Get oldest entries from primary queue
    const entries = await this.redis.zrange(primaryQueueKey, 0, limit - 1);

    const compatibleUsers: QueueEntry[] = [];

    for (const entryStr of entries) {
      try {
        const entry: QueueEntry = JSON.parse(entryStr);

        // Skip self
        if (entry.userId === preferences.userId) {
          continue;
        }

        // Check compatibility
        if (this.isCompatible(preferences, entry.preferences)) {
          compatibleUsers.push(entry);
        }
      } catch (error) {
        logger.error('Error parsing queue entry:', error);
      }
    }

    return compatibleUsers;
  }

  async removeUserFromQueue(userId: string, queueKey: string, entry: QueueEntry): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.zrem(queueKey, JSON.stringify(entry));
    pipeline.del(`user:${userId}:queue`);
    await pipeline.exec();
  }

  // Session management
  async createMatch(user1Id: string, user2Id: string, sessionId: string): Promise<void> {
    const matchData = {
      user1Id,
      user2Id,
      sessionId,
      createdAt: Date.now(),
      status: 'pending',
    };

    const pipeline = this.redis.pipeline();
    pipeline.hset(`match:${sessionId}`, matchData);
    pipeline.expire(`match:${sessionId}`, 300); // 5 minutes expiry
    pipeline.hset(`user:${user1Id}:match`, sessionId, JSON.stringify(matchData));
    pipeline.hset(`user:${user2Id}:match`, sessionId, JSON.stringify(matchData));
    await pipeline.exec();
  }

  async acceptMatch(userId: string, sessionId: string): Promise<boolean> {
    const match = await this.redis.hgetall(`match:${sessionId}`);

    if (!match || match.status !== 'pending') {
      return false;
    }

    // Mark as accepted by this user
    await this.redis.hset(`match:${sessionId}`, `${userId}_accepted`, 'true');

    // Check if both users have accepted
    const user1Accepted = await this.redis.hget(`match:${sessionId}`, `${match.user1Id}_accepted`);
    const user2Accepted = await this.redis.hget(`match:${sessionId}`, `${match.user2Id}_accepted`);

    if (user1Accepted && user2Accepted) {
      await this.redis.hset(`match:${sessionId}`, 'status', 'accepted');
      return true;
    }

    return false;
  }

  async rejectMatch(userId: string, sessionId: string): Promise<void> {
    await this.redis.hset(`match:${sessionId}`, 'status', 'rejected');
    await this.redis.expire(`match:${sessionId}`, 60); // Expire in 1 minute
  }

  // Cleanup operations
  async cleanupStaleConnections(): Promise<void> {
    const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago

    // Get all queue keys
    const queueKeys = await this.redis.keys('queue:*');

    for (const queueKey of queueKeys) {
      // Remove entries older than cutoff time that haven't pinged
      await this.redis.zremrangebyscore(queueKey, '-inf', cutoffTime);
    }

    // Clean up expired user queue data
    const userKeys = await this.redis.keys('user:*:queue');
    for (const userKey of userKeys) {
      const userData = await this.redis.hgetall(userKey);
      if (userData.timestamp && parseInt(userData.timestamp) < cutoffTime) {
        await this.redis.del(userKey);
      }
    }

    logger.info('Cleaned up stale queue connections');
  }

  async setUserLastSeen(userId: string): Promise<void> {
    await this.redis.hset(`user:${userId}:status`, 'lastSeen', Date.now());
    await this.redis.expire(`user:${userId}:status`, 24 * 60 * 60); // 24 hours
  }

  async getUserLastSeen(userId: string): Promise<number | null> {
    const lastSeen = await this.redis.hget(`user:${userId}:status`, 'lastSeen');
    return lastSeen ? parseInt(lastSeen) : null;
  }

  // Analytics and monitoring
  async getQueueStats(): Promise<Record<string, number>> {
    const queueKeys = await this.redis.keys('queue:*');
    const stats: Record<string, number> = {};

    for (const queueKey of queueKeys) {
      const count = await this.redis.zcard(queueKey);
      stats[queueKey] = count;
    }

    return stats;
  }

  // Private helper methods
  private getQueueKey(nativeLanguage: string, targetLanguage: string): string {
    return `queue:${nativeLanguage}:${targetLanguage}`;
  }

  private isCompatible(userPrefs: MatchingPreferences, candidatePrefs: MatchingPreferences): boolean {
    // Age compatibility
    if (userPrefs.age_min && candidatePrefs.age < userPrefs.age_min) return false;
    if (userPrefs.age_max && candidatePrefs.age > userPrefs.age_max) return false;
    if (candidatePrefs.age_min && userPrefs.age < candidatePrefs.age_min) return false;
    if (candidatePrefs.age_max && userPrefs.age > candidatePrefs.age_max) return false;

    // Gender compatibility
    if (userPrefs.gender_preference &&
        userPrefs.gender_preference !== 'any' &&
        candidatePrefs.gender !== userPrefs.gender_preference) {
      return false;
    }

    if (candidatePrefs.gender_preference &&
        candidatePrefs.gender_preference !== 'any' &&
        userPrefs.gender !== candidatePrefs.gender_preference) {
      return false;
    }

    return true;
  }
}