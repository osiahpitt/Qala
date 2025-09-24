import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import type { Socket } from 'socket.io';
import type { MatchingSocketData } from '../types/socket';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authMiddleware = async (
  socket: Socket<any, any, any, MatchingSocketData>,
  next: (err?: Error) => void
) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('No token provided for socket connection');
      return next(new Error('Authentication required'));
    }

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid token provided for socket connection:', error?.message);
      return next(new Error('Invalid token'));
    }

    // Fetch user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, native_language, target_languages, age, gender, is_banned')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      logger.warn(`User profile not found for user ${user.id}`);
      return next(new Error('User profile required'));
    }

    // Check if user is banned
    if (userProfile.is_banned) {
      logger.warn(`Banned user attempted to connect: ${user.id}`);
      return next(new Error('Account suspended'));
    }

    // Set user data in socket context
    socket.data = {
      userId: user.id,
      userEmail: user.email!,
      userProfile,
    };

    logger.info(`Authenticated socket connection for user: ${user.email} (${user.id})`);
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    next(new Error('Authentication failed'));
  }
};

export const validateSocketToken = async (token: string): Promise<{ userId: string; email: string } | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email!,
    };
  } catch (error) {
    logger.error('Token validation error:', error);
    return null;
  }
};

// Rate limiting for socket events
const userEventCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (eventsPerMinute: number = 60) => {
  return (socket: Socket, next: (err?: Error) => void) => {
    const userId = socket.data?.userId;

    if (!userId) {
      return next();
    }

    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${userId}:${minute}`;

    const current = userEventCounts.get(key) || { count: 0, resetTime: minute };

    if (current.resetTime < minute) {
      // Reset counter for new minute
      current.count = 0;
      current.resetTime = minute;
    }

    current.count++;

    if (current.count > eventsPerMinute) {
      logger.warn(`Rate limit exceeded for user ${userId}: ${current.count} events in minute ${minute}`);
      return next(new Error('Rate limit exceeded'));
    }

    userEventCounts.set(key, current);

    // Cleanup old entries periodically
    if (userEventCounts.size > 10000) {
      const cutoff = minute - 5; // Keep last 5 minutes
      for (const [mapKey, data] of userEventCounts.entries()) {
        if (data.resetTime < cutoff) {
          userEventCounts.delete(mapKey);
        }
      }
    }

    next();
  };
};