"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimit: {
        windowMs: 1 * 60 * 1000,
        max: 100,
    },
    socketIo: {
        transports: ['websocket', 'polling'],
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            methods: ['GET', 'POST'],
            credentials: true,
        },
    },
    matching: {
        maxQueueWaitTime: 5 * 60 * 1000,
        cleanupInterval: 5 * 60 * 1000,
        maxUsersPerLanguagePair: 1000,
        matchTimeoutMs: 30 * 1000,
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        maxFileSize: 5 * 1024 * 1024,
        maxFiles: 5,
    },
    security: {
        jwtSecret: process.env.JWT_SECRET || 'development-secret-change-in-production',
        sessionExpiry: 24 * 60 * 60 * 1000,
    },
};
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is not set`);
    }
}
exports.default = exports.config;
//# sourceMappingURL=server.js.map