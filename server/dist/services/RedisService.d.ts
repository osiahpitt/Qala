import type { MatchingPreferences, QueueEntry } from '../types/matching';
export declare class RedisService {
    private redis;
    private subscriber;
    private publisher;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    addToQueue(userId: string, preferences: MatchingPreferences): Promise<number>;
    removeFromQueue(userId: string): Promise<void>;
    addToQueueWithPriority(userId: string, preferences: MatchingPreferences): Promise<number>;
    getQueuePosition(userId: string): Promise<number | null>;
    getQueueLength(nativeLanguage: string, targetLanguage: string): Promise<number>;
    findCompatibleUsersInQueue(preferences: MatchingPreferences, limit?: number): Promise<QueueEntry[]>;
    removeUserFromQueue(userId: string, queueKey: string, entry: QueueEntry): Promise<void>;
    createMatch(user1Id: string, user2Id: string, sessionId: string): Promise<void>;
    acceptMatch(userId: string, sessionId: string): Promise<boolean>;
    rejectMatch(userId: string, sessionId: string): Promise<void>;
    cleanupStaleConnections(): Promise<void>;
    setUserLastSeen(userId: string): Promise<void>;
    getUserLastSeen(userId: string): Promise<number | null>;
    getQueueStats(): Promise<Record<string, number>>;
    private getQueueKey;
    private isCompatible;
}
//# sourceMappingURL=RedisService.d.ts.map