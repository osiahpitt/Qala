"use strict";
const __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./middleware/auth");
const MatchingService_1 = require("./services/MatchingService");
const RedisService_1 = require("./services/RedisService");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});
exports.io = io;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "wss:", "ws:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        server: 'qala-signaling-server',
        version: '1.0.0'
    });
});
const redisService = new RedisService_1.RedisService();
const matchingService = new MatchingService_1.MatchingService(redisService);
io.use(auth_1.authMiddleware);
io.on('connection', (socket) => {
    const userId = socket.data.userId;
    const userEmail = socket.data.userEmail;
    logger_1.logger.info(`User connected: ${userEmail} (${userId})`);
    socket.join(`user:${userId}`);
    socket.on('matching:join_queue', async (preferences, callback) => {
        try {
            logger_1.logger.info(`User ${userId} joining queue with preferences:`, preferences);
            const queuePosition = await matchingService.joinQueue(userId, preferences);
            const roomName = `queue:${preferences.native_language}:${preferences.target_language}`;
            socket.join(roomName);
            callback({
                success: true,
                queuePosition,
                estimatedWait: await matchingService.getEstimatedWaitTime(preferences)
            });
            const match = await matchingService.findMatch(userId, preferences);
            if (match) {
                io.to(`user:${match.user1_id}`).emit('matching:match_found', {
                    matchId: match.id,
                    partnerId: match.user2_id,
                    sessionId: match.session_id,
                });
                io.to(`user:${match.user2_id}`).emit('matching:match_found', {
                    matchId: match.id,
                    partnerId: match.user1_id,
                    sessionId: match.session_id,
                });
            }
        }
        catch (error) {
            logger_1.logger.error(`Error joining queue for user ${userId}:`, error);
            callback({
                success: false,
                error: 'Failed to join queue. Please try again.'
            });
        }
    });
    socket.on('matching:leave_queue', async (callback) => {
        try {
            await matchingService.leaveQueue(userId);
            const rooms = Array.from(socket.rooms);
            rooms.forEach(room => {
                if (room.startsWith('queue:')) {
                    socket.leave(room);
                }
            });
            callback({ success: true });
            logger_1.logger.info(`User ${userId} left the matching queue`);
        }
        catch (error) {
            logger_1.logger.error(`Error leaving queue for user ${userId}:`, error);
            callback({
                success: false,
                error: 'Failed to leave queue.'
            });
        }
    });
    socket.on('matching:accept_match', async ({ matchId, sessionId }, callback) => {
        try {
            const accepted = await matchingService.acceptMatch(userId, matchId);
            if (accepted) {
                socket.join(`session:${sessionId}`);
                socket.to(`session:${sessionId}`).emit('matching:match_accepted', {
                    matchId,
                    sessionId,
                    acceptedBy: userId
                });
                callback({ success: true });
                logger_1.logger.info(`User ${userId} accepted match ${matchId}`);
            }
            else {
                callback({
                    success: false,
                    error: 'Match no longer available.'
                });
            }
        }
        catch (error) {
            logger_1.logger.error(`Error accepting match for user ${userId}:`, error);
            callback({
                success: false,
                error: 'Failed to accept match.'
            });
        }
    });
    socket.on('matching:reject_match', async ({ matchId }, callback) => {
        try {
            await matchingService.rejectMatch(userId, matchId);
            callback({ success: true });
            logger_1.logger.info(`User ${userId} rejected match ${matchId}`);
            const preferences = await matchingService.getUserPreferences(userId);
            if (preferences) {
                await matchingService.joinQueue(userId, preferences, true);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error rejecting match for user ${userId}:`, error);
            callback({
                success: false,
                error: 'Failed to reject match.'
            });
        }
    });
    socket.on('webrtc:offer', ({ sessionId, offer }) => {
        socket.to(`session:${sessionId}`).emit('webrtc:offer', { sessionId, offer, from: userId });
    });
    socket.on('webrtc:answer', ({ sessionId, answer }) => {
        socket.to(`session:${sessionId}`).emit('webrtc:answer', { sessionId, answer, from: userId });
    });
    socket.on('webrtc:ice_candidate', ({ sessionId, candidate }) => {
        socket.to(`session:${sessionId}`).emit('webrtc:ice_candidate', { sessionId, candidate, from: userId });
    });
    socket.on('webrtc:connection_ready', ({ sessionId }) => {
        socket.to(`session:${sessionId}`).emit('webrtc:connection_ready', { sessionId, from: userId });
    });
    socket.on('disconnect', async (reason) => {
        logger_1.logger.info(`User ${userId} disconnected: ${reason}`);
        try {
            await matchingService.leaveQueue(userId);
            await redisService.setUserLastSeen(userId);
        }
        catch (error) {
            logger_1.logger.error(`Error handling disconnect for user ${userId}:`, error);
        }
    });
    socket.on('heartbeat', (callback) => {
        callback({ timestamp: Date.now() });
    });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    logger_1.logger.info(`🚀 QALA Signaling Server running on port ${PORT}`);
    logger_1.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    setInterval(async () => {
        try {
            await matchingService.cleanupStaleConnections();
        }
        catch (error) {
            logger_1.logger.error('Error in cleanup task:', error);
        }
    }, 5 * 60 * 1000);
});
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    server.close(async () => {
        await redisService.disconnect();
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    server.close(async () => {
        await redisService.disconnect();
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map