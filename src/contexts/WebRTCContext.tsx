'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';
import { PeerConnectionManager, ConnectionQuality } from '@/lib/webrtc/PeerConnection';
import { logger } from '@/lib/utils/logger';

export interface WebRTCContextType {
  // Connection state
  isConnecting: boolean;
  isConnected: boolean;
  connectionError: string | null;
  connectionQuality: ConnectionQuality | null;

  // Media streams
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  // Media controls
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  toggleVideo: () => void;
  toggleAudio: () => void;

  // Call management
  initializeCall: (sessionId: string, isInitiator: boolean) => Promise<void>;
  endCall: () => void;

  // Quality management
  currentQuality: 'high' | 'medium' | 'low';
  adaptiveQuality: boolean;
  setAdaptiveQuality: (enabled: boolean) => void;
  changeQuality: (quality: 'high' | 'medium' | 'low') => void;

  // Data channel
  sendMessage: (message: any) => void;
  setDataMessageHandler: (handler: ((message: any) => void) | undefined) => void;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};

interface WebRTCProviderProps {
  children: React.ReactNode;
}

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
  const { socket, isConnected: socketConnected } = useSocket();

  // Connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | null>(null);

  // Media streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Media controls
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Quality management
  const [currentQuality, setCurrentQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [adaptiveQuality, setAdaptiveQuality] = useState(true);

  // Refs
  const peerManager = useRef<PeerConnectionManager | null>(null);
  const currentSessionId = useRef<string | null>(null);
  const dataMessageHandler = useRef<((message: any) => void) | undefined>();

  // Initialize WebRTC call
  const initializeCall = useCallback(async (sessionId: string, isInitiator: boolean) => {
    if (!socketConnected || !socket) {
      throw new Error('Socket not connected');
    }

    if (peerManager.current) {
      peerManager.current.destroy();
    }

    setIsConnecting(true);
    setConnectionError(null);
    currentSessionId.current = sessionId;

    try {
      // Create peer connection manager
      peerManager.current = new PeerConnectionManager(isInitiator);

      // Set up local stream
      const stream = await peerManager.current.setLocalStream();
      setLocalStream(stream);

      // Set up event handlers
      peerManager.current.on('signal', (data) => {
        logger.debug('Sending WebRTC signal:', data);
        socket.emit('webrtc:signal', {
          sessionId,
          signal: data,
          type: data.type || 'ice-candidate'
        });
      });

      peerManager.current.on('stream', (stream) => {
        logger.info('Remote stream received');
        setRemoteStream(stream);
      });

      peerManager.current.on('connect', () => {
        logger.info('WebRTC connection established');
        setIsConnected(true);
        setIsConnecting(false);
        socket.emit('webrtc:connection_ready', { sessionId });
      });

      peerManager.current.on('error', (error) => {
        logger.error('WebRTC error:', error);
        setConnectionError(error.message);
        setIsConnecting(false);
      });

      peerManager.current.on('close', () => {
        logger.info('WebRTC connection closed');
        setIsConnected(false);
        setIsConnecting(false);
        cleanup();
      });

      peerManager.current.on('connectionQuality', (quality) => {
        setConnectionQuality(quality);
      });

      peerManager.current.on('data', (data) => {
        try {
          const message = JSON.parse(data.toString());
          dataMessageHandler.current?.(message);
        } catch (error) {
          logger.error('Error parsing data message:', error);
        }
      });

      logger.info(`WebRTC call initialized for session ${sessionId}, initiator: ${isInitiator}`);
    } catch (error) {
      logger.error('Error initializing WebRTC call:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to initialize call');
      setIsConnecting(false);
      throw error;
    }
  }, [socket, socketConnected, currentQuality]);

  // Handle WebRTC signaling from socket
  useEffect(() => {
    if (!socket || !socketConnected) return;

    const handleWebRTCSignal = (data: { sessionId: string; signal: any; from: string }) => {
      if (data.sessionId !== currentSessionId.current || !peerManager.current) {
        return;
      }

      logger.debug('Received WebRTC signal:', data.signal);
      peerManager.current.signal(data.signal);
    };

    const handleConnectionReady = (data: { sessionId: string; from: string }) => {
      if (data.sessionId === currentSessionId.current) {
        logger.info('Partner connection ready');
      }
    };

    socket.on('webrtc:signal', handleWebRTCSignal);
    socket.on('webrtc:connection_ready', handleConnectionReady);

    return () => {
      socket.off('webrtc:signal', handleWebRTCSignal);
      socket.off('webrtc:connection_ready', handleConnectionReady);
    };
  }, [socket, socketConnected]);

  // Media control functions
  const toggleVideo = useCallback(() => {
    if (!peerManager.current) return;

    const newState = !isVideoEnabled;
    peerManager.current.toggleVideo(newState);
    setIsVideoEnabled(newState);
  }, [isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    if (!peerManager.current) return;

    const newState = !isAudioEnabled;
    peerManager.current.toggleAudio(newState);
    setIsAudioEnabled(newState);
  }, [isAudioEnabled]);

  const changeQuality = useCallback(async (quality: 'high' | 'medium' | 'low') => {
    if (!peerManager.current || currentQuality === quality) return;

    try {
      await peerManager.current.adaptQuality(quality);
      setCurrentQuality(quality);
    } catch (error) {
      logger.error('Error changing quality:', error);
    }
  }, [currentQuality]);

  const sendMessage = useCallback((message: any) => {
    if (!peerManager.current || !isConnected) {
      logger.warn('Cannot send message: peer not connected');
      return;
    }

    peerManager.current.sendData(message);
  }, [isConnected]);

  const setDataMessageHandler = useCallback((handler: ((message: any) => void) | undefined) => {
    dataMessageHandler.current = handler;
  }, []);

  const endCall = useCallback(() => {
    logger.info('Ending WebRTC call');
    cleanup();
  }, []);

  const cleanup = useCallback(() => {
    if (peerManager.current) {
      peerManager.current.destroy();
      peerManager.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    setConnectionQuality(null);
    currentSessionId.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const value: WebRTCContextType = {
    isConnecting,
    isConnected,
    connectionError,
    connectionQuality,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    initializeCall,
    endCall,
    currentQuality,
    adaptiveQuality,
    setAdaptiveQuality,
    changeQuality,
    sendMessage,
    setDataMessageHandler,
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};