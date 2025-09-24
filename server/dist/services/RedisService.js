"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
class RedisService {
    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        this.subscriber = new ioredis_1.default(redisUrl, {
            lazyConnect: true,
        });
        this.publisher = new ioredis_1.default(redisUrl, {
            lazyConnect: true,
        });
        this.redis.on('connect', () => {
            logger_1.logger.info('Connected to Redis');
        });
        this.redis.on('error', (error) => {
            logger_1.logger.error('Redis connection error:', error);
        });
    }
    async connect() {
        await this.redis.connect();
        await this.subscriber.connect();
        await this.publisher.connect();
    }
    async disconnect() {
        await this.redis.disconnect();
        await this.subscriber.disconnect();
        await this.publisher.disconnect();
    }
    async addToQueue(userId, preferences) {
        const queueKey = this.getQueueKey(preferences.native_language, preferences.target_language);
        const timestamp = Date.now();
        const entry = {
            userId,
            preferences,
            timestamp,
            priority: false,
        };
        const pipeline = this.redis.pipeline();
        pipeline.zadd(queueKey, timestamp, JSON.stringify(entry));
        pipeline.hset(`user:${userId}:queue`, {
            queueKey,
            timestamp,
            preferences: JSON.stringify(preferences),
        });
        await pipeline.exec();
        const position = await this.redis.zrank(queueKey, JSON.stringify(entry));
        return (position || 0) + 1;
    }
    async removeFromQueue(userId) {
        const userQueue = await this.redis.hgetall(`user:${userId}:queue`);
        if (userQueue.queueKey && userQueue.preferences && userQueue.timestamp) {
            const entry = {
                userId,
                preferences: JSON.parse(userQueue.preferences),
                timestamp: parseInt(userQueue.timestamp),
                priority: false,
            };
            await this.redis.zrem(userQueue.queueKey, JSON.stringify(entry));
        }
        await this.redis.del(`user:${userId}:queue`);
    }
    async addToQueueWithPriority(userId, preferences) {
        const queueKey = this.getQueueKey(preferences.native_language, preferences.target_language);
        const timestamp = Date.now() - 10000;
        const entry = {
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
    async getQueuePosition(userId) {
        const userQueue = await this.redis.hgetall(`user:${userId}:queue`);
        if (!userQueue.queueKey || !userQueue.preferences || !userQueue.timestamp) {
            return null;
        }
        const entry = {
            userId,
            preferences: JSON.parse(userQueue.preferences),
            timestamp: parseInt(userQueue.timestamp),
            priority: userQueue.priority === 'true',
        };
        const position = await this.redis.zrank(userQueue.queueKey, JSON.stringify(entry));
        return position !== null ? position + 1 : null;
    }
    async getQueueLength(nativeLanguage, targetLanguage) {
        const queueKey = this.getQueueKey(nativeLanguage, targetLanguage);
        return await this.redis.zcard(queueKey);
    }
    async findCompatibleUsersInQueue(preferences, limit = 10) {
        const primaryQueueKey = this.getQueueKey(preferences.target_language, preferences.native_language);
        const entries = await this.redis.zrange(primaryQueueKey, 0, limit - 1);
        const compatibleUsers = [];
        for (const entryStr of entries) {
            try {
                const entry = JSON.parse(entryStr);
                if (entry.userId === preferences.userId) {
                    continue;
                }
                if (this.isCompatible(preferences, entry.preferences)) {
                    compatibleUsers.push(entry);
                }
            }
            catch (error) {
                logger_1.logger.error('Error parsing queue entry:', error);
            }
        }
        return compatibleUsers;
    }
    async removeUserFromQueue(userId, queueKey, entry) {
        const pipeline = this.redis.pipeline();
        pipeline.zrem(queueKey, JSON.stringify(entry));
        pipeline.del(`user:${userId}:queue`);
        await pipeline.exec();
    }
    async createMatch(user1Id, user2Id, sessionId) {
        const matchData = {
            user1Id,
            user2Id,
            sessionId,
            createdAt: Date.now(),
            status: 'pending',
        };
        const pipeline = this.redis.pipeline();
        pipeline.hset(`match:${sessionId}`, matchData);
        pipeline.expire(`match:${sessionId}`, 300);
        pipeline.hset(`user:${user1Id}:match`, sessionId, JSON.stringify(matchData));
        pipeline.hset(`user:${user2Id}:match`, sessionId, JSON.stringify(matchData));
        await pipeline.exec();
    }
    async acceptMatch(userId, sessionId) {
        const match = await this.redis.hgetall(`match:${sessionId}`);
        if (!match || match.status !== 'pending') {
            return false;
        }
        await this.redis.hset(`match:${sessionId}`, `${userId}_accepted`, 'true');
        const user1Accepted = await this.redis.hget(`match:${sessionId}`, `${match.user1Id}_accepted`);
        const user2Accepted = await this.redis.hget(`match:${sessionId}`, `${match.user2Id}_accepted`);
        if (user1Accepted && user2Accepted) {
            await this.redis.hset(`match:${sessionId}`, 'status', 'accepted');
            return true;
        }
        return false;
    }
    async rejectMatch(userId, sessionId) {
        await this.redis.hset(`match:${sessionId}`, 'status', 'rejected');
        await this.redis.expire(`match:${sessionId}`, 60);
    }
    async cleanupStaleConnections() {
        const cutoffTime = Date.now() - (5 * 60 * 1000);
        const queueKeys = await this.redis.keys('queue:*');
        for (const queueKey of queueKeys) {
            await this.redis.zremrangebyscore(queueKey, '-inf', cutoffTime);
        }
        const userKeys = await this.redis.keys('user:*:queue');
        for (const userKey of userKeys) {
            const userData = await this.redis.hgetall(userKey);
            if (userData.timestamp && parseInt(userData.timestamp) < cutoffTime) {
                await this.redis.del(userKey);
            }
        }
        logger_1.logger.info('Cleaned up stale queue connections');
    }
    async setUserLastSeen(userId) {
        await this.redis.hset(`user:${userId}:status`, 'lastSeen', Date.now());
        await this.redis.expire(`user:${userId}:status`, 24 * 60 * 60);
    }
    async getUserLastSeen(userId) {
        const lastSeen = await this.redis.hget(`user:${userId}:status`, 'lastSeen');
        return lastSeen ? parseInt(lastSeen) : null;
    }
    async getQueueStats() {
        const queueKeys = await this.redis.keys('queue:*');
        const stats = {};
        for (const queueKey of queueKeys) {
            const count = await this.redis.zcard(queueKey);
            stats[queueKey] = count;
        }
        return stats;
    }
    getQueueKey(nativeLanguage, targetLanguage) {
        return `queue:${nativeLanguage}:${targetLanguage}`;
    }
    isCompatible(userPrefs, candidatePrefs) {
        if (userPrefs.age_min && candidatePrefs.age < userPrefs.age_min)
            return false;
        if (userPrefs.age_max && candidatePrefs.age > userPrefs.age_max)
            return false;
        if (candidatePrefs.age_min && userPrefs.age < candidatePrefs.age_min)
            return false;
        if (candidatePrefs.age_max && userPrefs.age > candidatePrefs.age_max)
            return false;
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
exports.RedisService = RedisService;
//# sourceMappingURL=RedisService.js.map