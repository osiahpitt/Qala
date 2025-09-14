// Global type definitions for QALA platform

// Database table types (based on CLAUDE.md schema)
export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  native_language: string
  target_languages: string[]
  proficiency_levels: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'native'>
  age: number
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say'
  country: string
  timezone: string
  subscription_tier: 'free' | 'premium'
  translation_quota_used: number
  quota_reset_date: string
  is_banned: boolean
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user1_id: string
  user2_id: string
  started_at: string
  ended_at?: string
  duration?: number // seconds
  user1_rating?: number
  user2_rating?: number
  connection_quality?: ConnectionQuality
  session_status: 'active' | 'completed' | 'cancelled' | 'failed' | 'reported'
  created_at: string
}

export interface ConnectionQuality {
  avg_bitrate?: number
  avg_latency?: number
  packet_loss?: number
  connection_drops?: number
  audio_issues?: number
  video_issues?: number
}

export interface Vocabulary {
  id: string
  user_id: string
  session_id?: string
  original_text: string
  translated_text: string
  source_lang: string
  target_lang: string
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  reported_id: string
  session_id?: string
  reason: string
  description?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_at?: string
  reviewed_by?: string
  action_taken?: string
  created_at: string
}

export interface MatchingQueue {
  id: string
  user_id: string
  native_language: string
  target_language: string
  preferred_age_min?: number
  preferred_age_max?: number
  preferred_gender?: 'male' | 'female' | 'non-binary' | 'any'
  queue_position?: number
  entered_at: string
  last_ping: string
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  subscription_tier: 'free' | 'premium'
  is_banned: boolean
}

// WebRTC types
export interface RTCConnectionConfig {
  iceServers: RTCIceServer[]
  iceTransportPolicy?: RTCIceTransportPolicy
  bundlePolicy?: RTCBundlePolicy
}

export interface MediaConstraintsConfig {
  video: MediaTrackConstraints | boolean
  audio: MediaTrackConstraints | boolean
}

export interface ConnectionStats {
  bitrate: number
  latency: number
  packet_loss: number
  jitter: number
  bandwidth: number
  audio_codec?: string
  video_codec?: string
  resolution?: string
  frame_rate?: number
}

// Matching types
export interface MatchingPreferences {
  target_language: string
  preferred_age_min?: number
  preferred_age_max?: number
  preferred_gender?: 'male' | 'female' | 'non-binary' | 'any'
  preferred_proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'any'
}

export interface MatchResult {
  matched_user: User
  session_id: string
  estimated_wait_time?: number
  connection_timeout: number
}

// Translation types
export interface TranslationRequest {
  text: string
  source_language: string
  target_language: string
  context?: string
}

export interface TranslationResponse {
  translated_text: string
  source_language: string
  target_language: string
  confidence?: number
  alternatives?: string[]
}

// UI state types
export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface ModalState {
  isOpen: boolean
  type?: string
  data?: unknown
}

// Utility types
export type SupportedLanguage =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'ru'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'ar'
  | 'hi'
  | 'th'
  | 'vi'
  | 'nl'
  | 'sv'
  | 'no'
  | 'da'
  | 'fi'
  | 'pl'

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'native'

export type SubscriptionTier = 'free' | 'premium'

export type Gender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say'

export type SessionStatus = 'active' | 'completed' | 'cancelled' | 'failed' | 'reported'

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'
