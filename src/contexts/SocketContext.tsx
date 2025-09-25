'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { logger } from '@/lib/utils/logger';
import type {
  SocketEvents,
  MatchingPreferences,
  MatchNotification,
  QueueJoinResponse,
  MatchActionResponse
} from '@/types/matching';

interface SocketContextType {
  socket: Socket<SocketEvents, SocketEvents> | null;
  isConnected: boolean;
  connectionError: string | null;

  // Queue management
  joinQueue: (preferences: MatchingPreferences) => Promise<QueueJoinResponse>;
  leaveQueue: () => Promise<MatchActionResponse>;
  queuePosition: number | null;
  estimatedWait: number | null;

  // Match handling
  currentMatch: MatchNotification | null;
  acceptMatch: (matchId: string, sessionId: string) => Promise<MatchActionResponse>;
  rejectMatch: (matchId: string) => Promise<MatchActionResponse>;

  // Connection management
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, session } = useAuth();
  const [socket, setSocket] = useState<Socket<SocketEvents, SocketEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<number | null>(null);
  const [currentMatch, setCurrentMatch] = useState<MatchNotification | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const connect = useCallback(() => {
    if (!session?.access_token || socket?.connected || isRetrying) {
      return;
    }

    // Don't retry indefinitely - stop after 3 attempts
    if (retryCount >= 3) {
      setConnectionError('Unable to connect to real-time server. Video calls will not be available.');
      return;
    }

    setIsRetrying(true);
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';

    const newSocket = io(serverUrl, {
      auth: {
        token: session.access_token,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: false, // Disable automatic reconnection
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      logger.info('Connected to signaling server');
      setIsConnected(true);
      setConnectionError(null);
      setRetryCount(0);
      setIsRetrying(false);
    });

    newSocket.on('disconnect', (reason) => {
      logger.info('Disconnected from signaling server:', reason);
      setIsConnected(false);
      setQueuePosition(null);
      setEstimatedWait(null);
      setIsRetrying(false);
    });

    newSocket.on('connect_error', (error) => {
      logger.error('Socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
      setRetryCount(prev => prev + 1);
      setIsRetrying(false);

      // Don't spam the console with connection errors
      if (retryCount === 0) {
        console.warn('WebRTC signaling server is not available. Video calling features will be disabled.');
      }
    });

    // Matching event handlers
    newSocket.on('matching:match_found', (matchData) => {
      logger.info('Match found:', matchData);
      setCurrentMatch(matchData);
      setQueuePosition(null);
      setEstimatedWait(null);
    });

    newSocket.on('matching:match_accepted', (data) => {
      logger.info('Match accepted:', data);
      // Handle when partner accepts the match
    });

    // Queue updates (could be implemented for real-time position updates)
    // newSocket.on('queue:position_update', (data) => {
    //   setQueuePosition(data.position);
    //   setEstimatedWait(data.estimatedWait);
    // });

    // Heartbeat for connection monitoring
    const heartbeatInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('heartbeat', (response) => {
          // Handle heartbeat response if needed
          logger.debug('Heartbeat response:', response);
        });
      }
    }, 30000); // Every 30 seconds

    newSocket.on('disconnect', () => {
      clearInterval(heartbeatInterval);
    });

    setSocket(newSocket);
  }, [session?.access_token, socket?.connected, isRetrying, retryCount]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setQueuePosition(null);
      setEstimatedWait(null);
      setCurrentMatch(null);
    }
  }, [socket]);

  const joinQueue = useCallback(async (preferences: MatchingPreferences): Promise<QueueJoinResponse> => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      socket.emit('matching:join_queue', preferences, (response) => {
        if (response.success) {
          setQueuePosition(response.queuePosition || null);
          setEstimatedWait(response.estimatedWait || null);
        }
        resolve(response);
      });
    });
  }, [socket, isConnected]);

  const leaveQueue = useCallback(async (): Promise<MatchActionResponse> => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      socket.emit('matching:leave_queue', (response) => {
        if (response.success) {
          setQueuePosition(null);
          setEstimatedWait(null);
        }
        resolve(response);
      });
    });
  }, [socket, isConnected]);

  const acceptMatch = useCallback(async (matchId: string, sessionId: string): Promise<MatchActionResponse> => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      socket.emit('matching:accept_match', { matchId, sessionId }, (response) => {
        if (response.success) {
          // Match accepted, prepare for WebRTC connection
          setCurrentMatch(null);
        }
        resolve(response);
      });
    });
  }, [socket, isConnected]);

  const rejectMatch = useCallback(async (matchId: string): Promise<MatchActionResponse> => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      socket.emit('matching:reject_match', { matchId }, (response) => {
        if (response.success) {
          setCurrentMatch(null);
          // User will be automatically re-queued with priority
        }
        resolve(response);
      });
    });
  }, [socket, isConnected]);

  // Auto-connect when user is authenticated (only if server URL is configured)
  useEffect(() => {
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

    if (user && session?.access_token && serverUrl) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, session?.access_token, connect, disconnect]);

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionError,
    joinQueue,
    leaveQueue,
    queuePosition,
    estimatedWait,
    currentMatch,
    acceptMatch,
    rejectMatch,
    connect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};