/**
 * Zod schemas for matching queue and Socket.io events validation
 * Ensures type safety and data validation for real-time matching system
 */

import { z } from 'zod'

/**
 * Language code validation
 */
export const LanguageSchema = z
  .string()
  .min(2)
  .max(10)
  .regex(/^[a-z]{2,3}(-[A-Z]{2})?$/, 'Invalid language code format')

/**
 * Gender options for matching preferences
 */
export const GenderSchema = z.enum(['male', 'female', 'non-binary', 'any'])

/**
 * Proficiency levels for language matching
 */
export const ProficiencySchema = z.enum(['beginner', 'intermediate', 'advanced', 'any'])

/**
 * Age validation for matching preferences
 */
export const AgeSchema = z.number().int().min(16).max(100)

/**
 * Matching preferences schema
 */
export const MatchingPreferencesSchema = z.object({
  nativeLanguage: LanguageSchema,
  targetLanguage: LanguageSchema,
  preferredAgeMin: AgeSchema.optional(),
  preferredAgeMax: AgeSchema.optional(),
  preferredGender: GenderSchema.optional(),
  preferredProficiency: ProficiencySchema.optional(),
})

/**
 * Validate age range consistency
 */
export const ValidatedMatchingPreferencesSchema = MatchingPreferencesSchema.refine(
  (data) => {
    if (data.preferredAgeMin && data.preferredAgeMax) {
      return data.preferredAgeMin <= data.preferredAgeMax
    }
    return true
  },
  {
    message: 'Minimum age must be less than or equal to maximum age',
    path: ['preferredAgeMin'],
  }
)

/**
 * Queue entry schema
 */
export const MatchingQueueEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  preferences: MatchingPreferencesSchema,
  queuePosition: z.number().int().min(0),
  enteredAt: z.string().datetime(),
  lastPing: z.string().datetime(),
  estimatedWaitTime: z.number().int().min(0).optional(),
})

/**
 * User profile subset for matching
 */
export const MatchingUserProfileSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1).max(255),
  nativeLanguage: LanguageSchema,
  targetLanguages: z.array(LanguageSchema).min(1),
  age: AgeSchema,
  gender: z.enum(['male', 'female', 'non-binary']).optional(),
  avatarUrl: z.string().url().optional(),
})

/**
 * Match result schema
 */
export const MatchResultSchema = z.object({
  matchId: z.string().uuid(),
  user1: z.object({
    id: z.string().uuid(),
    profile: MatchingUserProfileSchema.omit({ id: true }),
  }),
  user2: z.object({
    id: z.string().uuid(),
    profile: MatchingUserProfileSchema.omit({ id: true }),
  }),
  roomId: z.string().uuid(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
})

/**
 * WebRTC signaling data schema
 */
export const SignalingDataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('offer'),
    sdp: z.string().min(1),
  }),
  z.object({
    type: z.literal('answer'),
    sdp: z.string().min(1),
  }),
  z.object({
    type: z.literal('ice-candidate'),
    candidate: z.object({
      candidate: z.string(),
      sdpMLineIndex: z.number().nullable(),
      sdpMid: z.string().nullable(),
      usernameFragment: z.string().nullable(),
    }),
  }),
  z.object({
    type: z.literal('ice-candidate-error'),
    error: z.string().min(1),
  }),
])

/**
 * Chat message schema
 */
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  senderId: z.string().uuid(),
  senderName: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  timestamp: z.string().datetime(),
  isTranslated: z.boolean().optional(),
  originalText: z.string().optional(),
  translatedText: z.string().optional(),
})

/**
 * Connection quality schema
 */
export const ConnectionQualitySchema = z.object({
  bandwidth: z.number().min(0),
  latency: z.number().min(0),
  packetLoss: z.number().min(0).max(100),
  videoResolution: z.string().regex(/^\d+x\d+$/),
  audioQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
  connectionType: z.enum(['direct', 'relay']),
})

/**
 * Session end reason schema
 */
export const SessionEndReasonSchema = z.enum([
  'user_left',
  'timeout',
  'connection_failed',
  'reported',
  'error',
])

/**
 * Session rating schema
 */
export const SessionRatingSchema = z.object({
  sessionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
  reportReason: z.string().max(100).optional(),
  reportDescription: z.string().max(1000).optional(),
})

/**
 * Socket authentication token schema
 */
export const SocketAuthTokenSchema = z.string().min(1)

/**
 * Room ID schema
 */
export const RoomIdSchema = z.string().uuid()

/**
 * User ID schema
 */
export const UserIdSchema = z.string().uuid()

/**
 * Socket.io event validation schemas
 */
export const SocketEventSchemas = {
  // Authentication
  authenticate: z.object({
    token: SocketAuthTokenSchema,
  }),

  // Queue management
  joinQueue: z.object({
    preferences: ValidatedMatchingPreferencesSchema,
  }),

  // Match handling
  acceptMatch: z.object({
    matchId: z.string().uuid(),
  }),

  rejectMatch: z.object({
    matchId: z.string().uuid(),
  }),

  // Session management
  joinRoom: z.object({
    roomId: RoomIdSchema,
  }),

  endSession: z.object({
    sessionId: z.string().uuid(),
    reason: SessionEndReasonSchema,
  }),

  // WebRTC signaling
  signal: z.object({
    roomId: RoomIdSchema,
    data: SignalingDataSchema,
  }),

  // Chat
  sendMessage: z.object({
    roomId: RoomIdSchema,
    message: z.string().min(1).max(1000),
  }),

  translateMessage: z.object({
    messageId: z.string().uuid(),
    targetLanguage: LanguageSchema,
  }),

  // Connection monitoring
  reportQuality: z.object({
    roomId: RoomIdSchema,
    quality: ConnectionQualitySchema,
  }),

  // Session feedback
  rateSession: z.object({
    rating: SessionRatingSchema,
  }),

  reportUser: z.object({
    userId: UserIdSchema,
    reason: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
  }),
} as const

/**
 * Type exports for use in other modules
 */
export type MatchingPreferences = z.infer<typeof MatchingPreferencesSchema>
export type ValidatedMatchingPreferences = z.infer<typeof ValidatedMatchingPreferencesSchema>
export type MatchingQueueEntry = z.infer<typeof MatchingQueueEntrySchema>
export type MatchingUserProfile = z.infer<typeof MatchingUserProfileSchema>
export type MatchResult = z.infer<typeof MatchResultSchema>
export type SignalingData = z.infer<typeof SignalingDataSchema>
export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type ConnectionQuality = z.infer<typeof ConnectionQualitySchema>
export type SessionEndReason = z.infer<typeof SessionEndReasonSchema>
export type SessionRating = z.infer<typeof SessionRatingSchema>

/**
 * Validation helper functions
 */
export const validateSocketEvent = <T extends keyof typeof SocketEventSchemas>(
  eventType: T,
  data: unknown
): { success: true; data: z.infer<typeof SocketEventSchemas[T]> } | { success: false; error: string } => {
  try {
    const schema = SocketEventSchemas[eventType]
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation failed for ${eventType}: ${error.errors.map((e: any) => e.message).join(', ')}`,
      }
    }
    return {
      success: false,
      error: `Unknown validation error for ${eventType}`,
    }
  }
}

/**
 * Check if two users are compatible for matching
 */
export const areUsersCompatible = (
  user1: MatchingUserProfile,
  user1Preferences: MatchingPreferences,
  user2: MatchingUserProfile,
  user2Preferences: MatchingPreferences
): boolean => {
  // Language compatibility: user1's target should include user2's native and vice versa
  const languageCompatible =
    user1Preferences.targetLanguage === user2.nativeLanguage &&
    user2Preferences.targetLanguage === user1.nativeLanguage

  if (!languageCompatible) {
    return false
  }

  // Age compatibility check
  if (user1Preferences.preferredAgeMin && user2.age < user1Preferences.preferredAgeMin) {
    return false
  }
  if (user1Preferences.preferredAgeMax && user2.age > user1Preferences.preferredAgeMax) {
    return false
  }
  if (user2Preferences.preferredAgeMin && user1.age < user2Preferences.preferredAgeMin) {
    return false
  }
  if (user2Preferences.preferredAgeMax && user1.age > user2Preferences.preferredAgeMax) {
    return false
  }

  // Gender compatibility check
  if (
    user1Preferences.preferredGender &&
    user1Preferences.preferredGender !== 'any' &&
    user2.gender !== user1Preferences.preferredGender
  ) {
    return false
  }
  if (
    user2Preferences.preferredGender &&
    user2Preferences.preferredGender !== 'any' &&
    user1.gender !== user2Preferences.preferredGender
  ) {
    return false
  }

  return true
}

/**
 * Calculate match quality score (0-100)
 */
export const calculateMatchQuality = (
  user1: MatchingUserProfile,
  user1Preferences: MatchingPreferences,
  user2: MatchingUserProfile,
  user2Preferences: MatchingPreferences
): number => {
  if (!areUsersCompatible(user1, user1Preferences, user2, user2Preferences)) {
    return 0
  }

  let score = 50 // Base compatibility score

  // Age similarity bonus (closer ages get higher scores)
  const ageDifference = Math.abs(user1.age - user2.age)
  if (ageDifference <= 2) {
    score += 20
  } else if (ageDifference <= 5) {
    score += 15
  } else if (ageDifference <= 10) {
    score += 10
  } else if (ageDifference <= 15) {
    score += 5
  }

  // Gender preference satisfaction
  const user1GenderMatch =
    !user1Preferences.preferredGender ||
    user1Preferences.preferredGender === 'any' ||
    user2.gender === user1Preferences.preferredGender

  const user2GenderMatch =
    !user2Preferences.preferredGender ||
    user2Preferences.preferredGender === 'any' ||
    user1.gender === user2Preferences.preferredGender

  if (user1GenderMatch && user2GenderMatch) {
    score += 15
  } else if (user1GenderMatch || user2GenderMatch) {
    score += 10
  }

  // Language pair popularity bonus (common pairs get slight bonus for faster matching)
  const commonPairs = [
    ['en', 'es'],
    ['en', 'fr'],
    ['en', 'de'],
    ['en', 'ja'],
    ['en', 'ko'],
    ['es', 'en'],
    ['fr', 'en'],
  ]
  const isCommonPair = commonPairs.some(
    ([lang1, lang2]) =>
      (user1.nativeLanguage === lang1 && user2.nativeLanguage === lang2) ||
      (user1.nativeLanguage === lang2 && user2.nativeLanguage === lang1)
  )
  if (isCommonPair) {
    score += 10
  }

  return Math.min(100, Math.max(0, score))
}