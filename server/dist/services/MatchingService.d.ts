import { RedisService } from './RedisService';
import type { MatchingPreferences, MatchResult } from '../types/matching';
export declare class MatchingService {
    private supabase;
    private redis;
    constructor(redisService: RedisService);
    joinQueue(userId: string, preferences: MatchingPreferences, priority?: boolean): Promise<number>;
    leaveQueue(userId: string): Promise<void>;
    findMatch(userId: string, preferences: MatchingPreferences): Promise<MatchResult | null>;
    acceptMatch(userId: string, matchId: string): Promise<boolean>;
    rejectMatch(userId: string, matchId: string): Promise<void>;
    getEstimatedWaitTime(preferences: MatchingPreferences): Promise<number>;
    getUserPreferences(userId: string): Promise<MatchingPreferences | null>;
    cleanupStaleConnections(): Promise<void>;
    private findExactMatch;
    private findMatchWithoutProficiency;
    private findMatchWithExpandedAge;
    private findMatchWithoutGender;
    private findLanguageOnlyMatch;
    private isExactMatch;
    private calculateCompatibilityScore;
    private createSession;
    private updateUserQueueStatus;
}
//# sourceMappingURL=MatchingService.d.ts.map