/**
 * Application constants for validation, limits, and configuration
 */

// **User Validation Constants**
export const USER_VALIDATION = {
  // Email constraints
  EMAIL_MIN_LENGTH: 3,
  EMAIL_MAX_LENGTH: 255,

  // Password constraints
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,

  // Name constraints
  NAME_MIN_LENGTH: 2,
  FULL_NAME_MAX_LENGTH: 255,

  // Age constraints
  MINIMUM_AGE: 16,
  MAXIMUM_AGE: 120,

  // Language constraints
  MAX_TARGET_LANGUAGES: 5,

  // Country code constraint
  COUNTRY_CODE_LENGTH: 3,

  // Timezone constraints
  TIMEZONE_MIN_LENGTH: 3,
  TIMEZONE_MAX_LENGTH: 50,
} as const

// **Session Validation Constants**
export const SESSION_VALIDATION = {
  // Rating constraints
  RATING_MIN: 1,
  RATING_MAX: 5,

  // Feedback constraints
  FEEDBACK_MAX_LENGTH: 500,

  // Report constraints
  REPORT_DESCRIPTION_MIN_LENGTH: 10,
  REPORT_DESCRIPTION_MAX_LENGTH: 1000,

  // Evidence constraints
  MAX_EVIDENCE_URLS: 5,

  // Session duration constraints (minutes)
  MIN_SESSION_DURATION: 5,
  MAX_SESSION_DURATION: 120,

  // Translation text constraints
  MAX_TRANSLATION_TEXT_LENGTH: 500,

  // Context constraints
  MAX_CONTEXT_LENGTH: 200,

  // Connection stats constraints
  MAX_PACKET_LOSS_PERCENT: 100,
} as const

// **Query Client Configuration**
export const QUERY_CLIENT_CONFIG = {
  // Cache duration (1 minute in milliseconds)
  STALE_TIME_MS: 60 * 1000,

  // HTTP status codes
  CLIENT_ERROR_MIN: 400,
  CLIENT_ERROR_MAX: 500,

  // Retry configuration
  MAX_RETRY_ATTEMPTS: 3,
} as const

// **Translation Service Constants**
export const TRANSLATION_CONFIG = {
  // Free tier limits per session
  FREE_TIER_TRANSLATION_LIMIT: 15,

  // Text length limits
  MAX_TRANSLATION_TEXT_LENGTH: 500,
} as const

// **WebRTC Configuration Constants**
export const WEBRTC_CONFIG = {
  // Connection timeouts (seconds)
  INITIAL_CONNECTION_TIMEOUT: 30,
  RECONNECTION_TIMEOUT: 10,

  // Video quality settings
  MAX_VIDEO_WIDTH: 1280,
  MAX_VIDEO_HEIGHT: 720,
  MAX_FRAME_RATE: 30,

  // Audio settings
  IDEAL_SAMPLE_RATE: 48000,
} as const

// **Matching System Constants**
export const MATCHING_CONFIG = {
  // Queue timeouts and intervals
  QUEUE_CLEANUP_MINUTES: 5,
  MATCHING_TIMEOUT_SECONDS: 60,

  // Age range expansions during fallback
  INITIAL_AGE_RANGE: 5,
  EXPANDED_AGE_RANGE: 10,

  // Queue position estimation
  AVERAGE_WAIT_TIME_SECONDS: 45,
} as const

// **Security Constants**
export const SECURITY_CONFIG = {
  // Rate limiting
  LOGIN_ATTEMPTS_PER_MINUTE: 5,
  MATCH_REQUESTS_PER_SECOND: 1,
  SIGNALING_MESSAGES_PER_SECOND: 10,

  // Session timeouts
  JWT_EXPIRATION_HOURS: 24,
  SESSION_TIMEOUT_MINUTES: 30,

  // Data retention
  CHAT_LOG_RETENTION_DAYS: 30,
} as const

// **Payment & Subscription Constants**
export const PAYMENT_CONFIG = {
  // Subscription limits
  FREE_TRIAL_DAYS: 7,
  TURN_SERVER_MONTHLY_LIMIT_USD: 50,

  // Cost per usage
  TURN_SERVER_COST_PER_GB: 0.0025,
} as const

// **Authentication Timing Constants**
export const AUTH_DELAYS = {
  SUCCESS_REDIRECT_DELAY: 1000,
  ERROR_REDIRECT_DELAY: 3000,
  LOADING_SIMULATION_DELAY: 500,
} as const