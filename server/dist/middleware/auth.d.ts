import type { Socket } from 'socket.io';
import type { MatchingSocketData } from '../types/socket';
export declare const authMiddleware: (socket: Socket<any, any, any, MatchingSocketData>, next: (err?: Error) => void) => Promise<void>;
export declare const validateSocketToken: (token: string) => Promise<{
    userId: string;
    email: string;
} | null>;
export declare const rateLimitMiddleware: (eventsPerMinute?: number) => (socket: Socket, next: (err?: Error) => void) => void;
//# sourceMappingURL=auth.d.ts.map