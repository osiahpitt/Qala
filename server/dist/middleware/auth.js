"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = exports.validateSocketToken = exports.authMiddleware = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../utils/logger");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const authMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
            logger_1.logger.warn('No token provided for socket connection');
            return next(new Error('Authentication required'));
        }
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            logger_1.logger.warn('Invalid token provided for socket connection:', error?.message);
            return next(new Error('Invalid token'));
        }
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('id, email, full_name, native_language, target_languages, age, gender, is_banned')
            .eq('id', user.id)
            .single();
        if (profileError || !userProfile) {
            logger_1.logger.warn(`User profile not found for user ${user.id}`);
            return next(new Error('User profile required'));
        }
        if (userProfile.is_banned) {
            logger_1.logger.warn(`Banned user attempted to connect: ${user.id}`);
            return next(new Error('Account suspended'));
        }
        socket.data = {
            userId: user.id,
            userEmail: user.email,
            userProfile,
        };
        logger_1.logger.info(`Authenticated socket connection for user: ${user.email} (${user.id})`);
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication middleware error:', error);
        next(new Error('Authentication failed'));
    }
};
exports.authMiddleware = authMiddleware;
const validateSocketToken = async (token) => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return null;
        }
        return {
            userId: user.id,
            email: user.email,
        };
    }
    catch (error) {
        logger_1.logger.error('Token validation error:', error);
        return null;
    }
};
exports.validateSocketToken = validateSocketToken;
const userEventCounts = new Map();
const rateLimitMiddleware = (eventsPerMinute = 60) => {
    return (socket, next) => {
        const userId = socket.data?.userId;
        if (!userId) {
            return next();
        }
        const now = Date.now();
        const minute = Math.floor(now / 60000);
        const key = `${userId}:${minute}`;
        const current = userEventCounts.get(key) || { count: 0, resetTime: minute };
        if (current.resetTime < minute) {
            current.count = 0;
            current.resetTime = minute;
        }
        current.count++;
        if (current.count > eventsPerMinute) {
            logger_1.logger.warn(`Rate limit exceeded for user ${userId}: ${current.count} events in minute ${minute}`);
            return next(new Error('Rate limit exceeded'));
        }
        userEventCounts.set(key, current);
        if (userEventCounts.size > 10000) {
            const cutoff = minute - 5;
            for (const [mapKey, data] of userEventCounts.entries()) {
                if (data.resetTime < cutoff) {
                    userEventCounts.delete(mapKey);
                }
            }
        }
        next();
    };
};
exports.rateLimitMiddleware = rateLimitMiddleware;
//# sourceMappingURL=auth.js.map