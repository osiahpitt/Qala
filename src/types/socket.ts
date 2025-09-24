/**
 * Socket.io types and event definitions for QALA language exchange platform
 * Defines all client-server communication patterns for real-time matching
 */

import type { UserProfile } from '@/contexts/AuthContext'

/**
 * Socket.io connection status
 */
export type SocketConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Matching preferences for queue entry
 */
export interface MatchingPreferences {
  nativeLanguage: string
  targetLanguage: string
  preferredAgeMin?: number
  preferredAgeMax?: number
  preferredGender?: 'male' | 'female' | 'non-binary' | 'any'
  preferredProficiency?: 'beginner' | 'intermediate' | 'advanced' | 'any'
}

/**
 * Matching queue entry
 */
export interface MatchingQueueEntry {
  id: string
  userId: string
  preferences: MatchingPreferences
  queuePosition: number
  enteredAt: string
  lastPing: string
  estimatedWaitTime?: number
}

/**
 * Match result when two users are paired
 */
export interface MatchResult {
  matchId: string
  user1: {
    id: string
    profile: Pick<UserProfile, 'fullName' | 'nativeLanguage' | 'targetLanguages' | 'age' | 'gender' | 'avatarUrl'>
  }
  user2: {
    id: string
    profile: Pick<UserProfile, 'fullName' | 'nativeLanguage' | 'targetLanguages' | 'age' | 'gender' | 'avatarUrl'>
  }
  roomId: string
  createdAt: string
  expiresAt: string
}

/**
 * WebRTC signaling data
 */
export interface SignalingData {
  type: 'offer' | 'answer' | 'ice-candidate' | 'ice-candidate-error'
  sdp?: string
  candidate?: RTCIceCandidate
  error?: string
}

/**
 * Chat message in video call
 */
export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: string
  isTranslated?: boolean
  originalText?: string
  translatedText?: string
}

/**
 * Connection quality stats
 */
export interface ConnectionQuality {
  bandwidth: number
  latency: number
  packetLoss: number
  videoResolution: string
  audioQuality: 'excellent' | 'good' | 'fair' | 'poor'
  connectionType: 'direct' | 'relay'
}

/**
 * Session end reason
 */
export type SessionEndReason =
  | 'user_left'
  | 'timeout'
  | 'connection_failed'
  | 'reported'
  | 'error'

/**
 * User rating for session
 */
export interface SessionRating {
  sessionId: string
  rating: 1 | 2 | 3 | 4 | 5
  feedback?: string
  reportReason?: string
  reportDescription?: string
}

/**
 * Client to server events
 */
export interface ClientToServerEvents {
  // Authentication
  authenticate: (token: string) => void

  // Matching queue
  join_queue: (preferences: MatchingPreferences) => void
  leave_queue: () => void

  // Session management
  accept_match: (matchId: string) => void
  reject_match: (matchId: string) => void
  join_room: (roomId: string) => void
  leave_room: (roomId: string) => void
  end_session: (sessionId: string, reason: SessionEndReason) => void

  // WebRTC signaling
  signal: (roomId: string, data: SignalingData) => void

  // Chat
  send_message: (roomId: string, message: string) => void
  translate_message: (messageId: string, targetLanguage: string) => void

  // Connection monitoring
  ping: () => void
  report_quality: (roomId: string, quality: ConnectionQuality) => void

  // Session feedback
  rate_session: (rating: SessionRating) => void
  report_user: (userId: string, reason: string, description?: string) => void
}

/**
 * Server to client events
 */
export interface ServerToClientEvents {
  // Connection status
  authenticated: (userId: string) => void
  authentication_error: (error: string) => void

  // Queue updates
  queue_joined: (entry: MatchingQueueEntry) => void
  queue_position_update: (position: number, estimatedWaitTime?: number) => void
  queue_left: () => void
  queue_error: (error: string) => void

  // Matching
  match_found: (match: MatchResult) => void
  match_expired: (matchId: string) => void
  match_accepted: (matchId: string, roomId: string) => void
  match_rejected: (matchId: string, reason?: string) => void

  // Session events
  session_started: (sessionId: string, roomId: string) => void
  session_ended: (sessionId: string, reason: SessionEndReason) => void
  user_joined_room: (userId: string) => void
  user_left_room: (userId: string) => void

  // WebRTC signaling
  signal: (data: SignalingData) => void

  // Chat
  message_received: (message: ChatMessage) => void
  message_translated: (messageId: string, translatedText: string) => void
  translation_error: (messageId: string, error: string) => void

  // Connection monitoring
  pong: () => void
  quality_update: (quality: ConnectionQuality) => void

  // Notifications
  notification: (type: 'info' | 'warning' | 'error', message: string) => void

  // Error handling
  error: (error: string) => void
  disconnect_reason: (reason: string) => void
}

/**
 * Socket instance with typed events
 */
export interface TypedSocket {
  connected: boolean
  id: string

  // Event emitters (client to server)
  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void

  // Event listeners (server to client)
  on<K extends keyof ServerToClientEvents>(
    event: K,
    listener: ServerToClientEvents[K]
  ): void

  off<K extends keyof ServerToClientEvents>(
    event: K,
    listener?: ServerToClientEvents[K]
  ): void

  once<K extends keyof ServerToClientEvents>(
    event: K,
    listener: ServerToClientEvents[K]
  ): void

  // Connection management
  connect(): void
  disconnect(): void

  // Socket.io specific methods
  timeout(timeout: number): TypedSocket
}

/**
 * Socket context state
 */
export interface SocketState {
  socket: TypedSocket | null
  connectionStatus: SocketConnectionStatus
  isAuthenticated: boolean
  currentMatch: MatchResult | null
  queueEntry: MatchingQueueEntry | null
  isInQueue: boolean
  isInSession: boolean
  currentSessionId: string | null
  currentRoomId: string | null
  connectionQuality: ConnectionQuality | null
  error: string | null
}

/**
 * Socket context interface
 */
export interface SocketContextType extends SocketState {
  // Connection management
  connect: () => void
  disconnect: () => void
  authenticate: (token: string) => void

  // Queue management
  joinQueue: (preferences: MatchingPreferences) => void
  leaveQueue: () => void

  // Match handling
  acceptMatch: (matchId: string) => void
  rejectMatch: (matchId: string) => void

  // Session management
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  endSession: (reason: SessionEndReason) => void

  // WebRTC signaling
  sendSignal: (data: SignalingData) => void

  // Chat
  sendMessage: (message: string) => void
  translateMessage: (messageId: string, targetLanguage: string) => void

  // Connection monitoring
  reportQuality: (quality: ConnectionQuality) => void

  // Session feedback
  rateSession: (rating: SessionRating) => void
  reportUser: (userId: string, reason: string, description?: string) => void

  // Error handling
  clearError: () => void
}