export const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],

  // Rate limiting
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // Socket.io
  socketIo: {
    transports: ['websocket', 'polling'],
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  },

  // Matching algorithm
  matching: {
    maxQueueWaitTime: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    maxUsersPerLanguagePair: 1000,
    matchTimeoutMs: 30 * 1000, // 30 seconds
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    sessionExpiry: 24 * 60 * 60 * 1000, // 24 hours
  },
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}

export default config;