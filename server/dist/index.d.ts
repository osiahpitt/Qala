import { Server } from 'socket.io';
import type { SocketEvents, MatchingSocketData } from './types/socket';
declare const server: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
declare const io: Server<SocketEvents, SocketEvents, MatchingSocketData, any>;
export { io, server };
//# sourceMappingURL=index.d.ts.map