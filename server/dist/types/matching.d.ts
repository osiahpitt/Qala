export interface MatchingPreferences {
    userId: string;
    native_language: string;
    target_language: string;
    age: number;
    gender: string;
    proficiency_level?: string;
    age_min?: number;
    age_max?: number;
    gender_preference?: 'male' | 'female' | 'any';
}
export interface QueueEntry {
    userId: string;
    preferences: MatchingPreferences;
    timestamp: number;
    priority: boolean;
}
export interface MatchResult {
    id: string;
    user1_id: string;
    user2_id: string;
    session_id: string;
    compatibility_score: number;
}
export interface QueueStats {
    totalUsers: number;
    averageWaitTime: number;
    languagePairs: Record<string, number>;
    activeMatches: number;
}
export interface CompatibilityFactors {
    languageMatch: number;
    ageCompatibility: number;
    genderPreference: number;
    proficiencyLevel: number;
    overallScore: number;
}
//# sourceMappingURL=matching.d.ts.map