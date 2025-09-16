import { z } from 'zod'
import { supportedLanguages } from './user'
import { SESSION_VALIDATION } from '../constants'

// Session rating schema
export const sessionRatingSchema = z.object({
  sessionId: z.string().uuid('Session ID must be a valid UUID'),

  rating: z
    .number()
    .min(SESSION_VALIDATION.RATING_MIN, 'Rating must be at least 1')
    .max(SESSION_VALIDATION.RATING_MAX, 'Rating must be at most 5')
    .int('Rating must be a whole number'),

  feedback: z.string().max(SESSION_VALIDATION.FEEDBACK_MAX_LENGTH, 'Feedback must not exceed 500 characters').optional(),

  wouldRecommend: z.boolean().optional(),

  connectionQuality: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),

  audioQuality: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),

  videoQuality: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
})

// Session report schema
export const sessionReportSchema = z.object({
  sessionId: z.string().uuid('Session ID must be a valid UUID'),

  reportedUserId: z.string().uuid('Reported user ID must be a valid UUID'),

  reason: z.enum(
    [
      'inappropriate-behavior',
      'harassment',
      'spam',
      'fake-profile',
      'technical-issues',
      'language-mismatch',
      'safety-concerns',
      'other',
    ],
    {
      message: 'Please select a report reason',
    }
  ),

  description: z
    .string()
    .min(SESSION_VALIDATION.REPORT_DESCRIPTION_MIN_LENGTH, 'Please provide at least 10 characters describing the issue')
    .max(SESSION_VALIDATION.REPORT_DESCRIPTION_MAX_LENGTH, 'Description must not exceed 1000 characters'),

  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),

  evidenceUrls: z
    .array(z.string().url('Evidence URL must be valid'))
    .max(SESSION_VALIDATION.MAX_EVIDENCE_URLS, 'You can provide up to 5 evidence URLs')
    .optional(),
})

// Session creation schema (for matching)
export const sessionCreationSchema = z
  .object({
    user1Id: z.string().uuid('User 1 ID must be a valid UUID'),

    user2Id: z.string().uuid('User 2 ID must be a valid UUID'),

    sessionType: z.enum(['video', 'audio-only']).default('video'),

    expectedDuration: z
      .number()
      .min(SESSION_VALIDATION.MIN_SESSION_DURATION, 'Session must be at least 5 minutes')
      .max(SESSION_VALIDATION.MAX_SESSION_DURATION, 'Session cannot exceed 120 minutes')
      .optional(),
  })
  .refine(data => data.user1Id !== data.user2Id, {
    message: 'Users cannot have a session with themselves',
    path: ['user2Id'],
  })

// Session update schema (for ending sessions)
export const sessionUpdateSchema = z.object({
  sessionId: z.string().uuid('Session ID must be a valid UUID'),

  endedAt: z.date().optional(),

  duration: z
    .number()
    .min(0, 'Duration must be positive')
    .int('Duration must be in whole seconds')
    .optional(),

  sessionStatus: z.enum(['active', 'completed', 'cancelled', 'failed', 'reported']).optional(),

  connectionQuality: z
    .object({
      avgBitrate: z.number().optional(),
      avgLatency: z.number().optional(),
      packetLoss: z.number().min(0).max(100).optional(),
      connectionDrops: z.number().min(0).optional(),
      audioIssues: z.number().min(0).optional(),
      videoIssues: z.number().min(0).optional(),
    })
    .optional(),
})

// Vocabulary save schema (during sessions)
export const vocabularySaveSchema = z
  .object({
    sessionId: z.string().uuid('Session ID must be a valid UUID'),

    originalText: z
      .string()
      .min(1, 'Original text cannot be empty')
      .max(SESSION_VALIDATION.MAX_TRANSLATION_TEXT_LENGTH, 'Original text must not exceed 500 characters')
      .trim(),

    translatedText: z
      .string()
      .min(1, 'Translated text cannot be empty')
      .max(SESSION_VALIDATION.MAX_TRANSLATION_TEXT_LENGTH, 'Translated text must not exceed 500 characters')
      .trim(),

    sourceLanguage: z.enum(supportedLanguages, {
      message: 'Please select a valid source language',
    }),

    targetLanguage: z.enum(supportedLanguages, {
      message: 'Please select a valid target language',
    }),

    context: z.string().max(SESSION_VALIDATION.MAX_CONTEXT_LENGTH, 'Context must not exceed 200 characters').optional(),

    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  })
  .refine(data => data.sourceLanguage !== data.targetLanguage, {
    message: 'Source and target languages must be different',
    path: ['targetLanguage'],
  })

// Session connection stats schema
export const connectionStatsSchema = z.object({
  sessionId: z.string().uuid('Session ID must be a valid UUID'),

  timestamp: z.date(),

  bitrate: z.number().min(0),
  latency: z.number().min(0),
  packetLoss: z.number().min(0).max(SESSION_VALIDATION.MAX_PACKET_LOSS_PERCENT),
  jitter: z.number().min(0),
  bandwidth: z.number().min(0),

  audioCodec: z.string().optional(),
  videoCodec: z.string().optional(),
  resolution: z.string().optional(),
  frameRate: z.number().min(0).optional(),
})

// Type exports
export type SessionRating = z.infer<typeof sessionRatingSchema>
export type SessionReport = z.infer<typeof sessionReportSchema>
export type SessionCreation = z.infer<typeof sessionCreationSchema>
export type SessionUpdate = z.infer<typeof sessionUpdateSchema>
export type VocabularySave = z.infer<typeof vocabularySaveSchema>
export type ConnectionStats = z.infer<typeof connectionStatsSchema>
