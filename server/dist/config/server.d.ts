export declare const config: {
    readonly port: string | 3001;
    readonly nodeEnv: string;
    readonly supabaseUrl: string;
    readonly supabaseServiceKey: string;
    readonly redisUrl: string;
    readonly allowedOrigins: string[];
    readonly rateLimit: {
        readonly windowMs: number;
        readonly max: 100;
    };
    readonly socketIo: {
        readonly transports: readonly ["websocket", "polling"];
        readonly cors: {
            readonly origin: string[];
            readonly methods: readonly ["GET", "POST"];
            readonly credentials: true;
        };
    };
    readonly matching: {
        readonly maxQueueWaitTime: number;
        readonly cleanupInterval: number;
        readonly maxUsersPerLanguagePair: 1000;
        readonly matchTimeoutMs: number;
    };
    readonly logging: {
        readonly level: string;
        readonly maxFileSize: number;
        readonly maxFiles: 5;
    };
    readonly security: {
        readonly jwtSecret: string;
        readonly sessionExpiry: number;
    };
};
export default config;
//# sourceMappingURL=server.d.ts.map