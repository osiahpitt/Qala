// Re-export all validation schemas
export * from './user'
export * from './session'
export * from './email'

// Common validation utilities
export { z } from 'zod'

// Import matching schemas with specific names to avoid conflicts
export type {
  MatchingPreferences as SocketMatchingPreferences,
  SessionRating as SocketSessionRating,
  QueueEntry,
  MatchmakingEvent
} from './matching'

export {
  MatchingPreferencesSchema,
  ValidatedMatchingPreferencesSchema,
  SessionRatingSchema,
  calculateCompatibilityScore,
  isEligibleForMatch,
  validateMatchmakingEvent
} from './matching'
