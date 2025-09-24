import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import { MatchingService } from './services/MatchingService';
import { RedisService } from './services/RedisService';
import { logger } from './utils/logger';
import { config } from './config/server';
import type { SocketEvents, MatchingSocketData } from './types/socket';

dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server<SocketEvents, SocketEvents, MatchingSocketData>(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'qala-signaling-server',
    version: '1.0.0'
  });
});

// Initialize services
const redisService = new RedisService();
const matchingService = new MatchingService(redisService);

// Socket.io authentication middleware
io.use(authMiddleware);

// Socket connection handling
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  const userEmail = socket.data.userEmail;

  logger.info(`User connected: ${userEmail} (${userId})`);

  // Join user to their personal room for direct messaging
  socket.join(`user:${userId}`);

  // Handle entering matching queue
  socket.on('matching:join_queue', async (preferences, callback) => {
    try {
      logger.info(`User ${userId} joining queue with preferences:`, preferences);

      const queuePosition = await matchingService.joinQueue(userId, preferences);

      // Join language-specific room for queue updates
      const roomName = `queue:${preferences.native_language}:${preferences.target_language}`;
      socket.join(roomName);

      callback({
        success: true,
        queuePosition,
        estimatedWait: await matchingService.getEstimatedWaitTime(preferences)
      });

      // Start looking for matches
      const match = await matchingService.findMatch(userId, preferences);

      if (match) {
        // Notify both users of the match
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
    } catch (error) {
      logger.error(`Error joining queue for user ${userId}:`, error);
      callback({
        success: false,
        error: 'Failed to join queue. Please try again.'
      });
    }
  });

  // Handle leaving matching queue
  socket.on('matching:leave_queue', async (callback) => {
    try {
      await matchingService.leaveQueue(userId);

      // Leave all queue rooms
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith('queue:')) {
          socket.leave(room);
        }
      });

      callback({ success: true });
      logger.info(`User ${userId} left the matching queue`);
    } catch (error) {
      logger.error(`Error leaving queue for user ${userId}:`, error);
      callback({
        success: false,
        error: 'Failed to leave queue.'
      });
    }
  });

  // Handle match acceptance
  socket.on('matching:accept_match', async ({ matchId, sessionId }, callback) => {
    try {
      const accepted = await matchingService.acceptMatch(userId, matchId);

      if (accepted) {
        // Join session room for signaling
        socket.join(`session:${sessionId}`);

        // Notify partner that match was accepted
        socket.to(`session:${sessionId}`).emit('matching:match_accepted', {
          matchId,
          sessionId,
          acceptedBy: userId
        });

        callback({ success: true });
        logger.info(`User ${userId} accepted match ${matchId}`);
      } else {
        callback({
          success: false,
          error: 'Match no longer available.'
        });
      }
    } catch (error) {
      logger.error(`Error accepting match for user ${userId}:`, error);
      callback({
        success: false,
        error: 'Failed to accept match.'
      });
    }
  });

  // Handle match rejection
  socket.on('matching:reject_match', async ({ matchId }, callback) => {
    try {
      await matchingService.rejectMatch(userId, matchId);

      callback({ success: true });
      logger.info(`User ${userId} rejected match ${matchId}`);

      // Return user to queue with higher priority
      const preferences = await matchingService.getUserPreferences(userId);
      if (preferences) {
        await matchingService.joinQueue(userId, preferences, true); // priority = true
      }
    } catch (error) {
      logger.error(`Error rejecting match for user ${userId}:`, error);
      callback({
        success: false,
        error: 'Failed to reject match.'
      });
    }
  });

  // WebRTC signaling events
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

  // Handle disconnection
  socket.on('disconnect', async (reason) => {
    logger.info(`User ${userId} disconnected: ${reason}`);

    try {
      // Remove from queue if still queued
      await matchingService.leaveQueue(userId);

      // Update last seen for reconnection handling
      await redisService.setUserLastSeen(userId);
    } catch (error) {
      logger.error(`Error handling disconnect for user ${userId}:`, error);
    }
  });

  // Heartbeat for connection monitoring
  socket.on('heartbeat', (callback) => {
    callback({ timestamp: Date.now() });
  });
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`🚀 QALA Signaling Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize cleanup tasks
  setInterval(async () => {
    try {
      await matchingService.cleanupStaleConnections();
    } catch (error) {
      logger.error('Error in cleanup task:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  server.close(async () => {
    await redisService.disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  server.close(async () => {
    await redisService.disconnect();
    process.exit(0);
  });
});

export { io, server };