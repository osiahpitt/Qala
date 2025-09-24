/**
 * Matching and Socket types for Phase 4 implementation
 * These match the server-side types for consistency
 */

export interface MatchingPreferences {
  userId: string;
  native_language: string;
  target_language: string;
  age: number;
  gender: string;
  proficiency_level: string;
  age_min?: number;
  age_max?: number;
  gender_preference?: 'male' | 'female' | 'any';
}

export interface QueueEntry {
  userId: string;
  preferences: MatchingPreferences;
  timestamp: number;
  priority: boolean;
}

export interface MatchResult {
  id: string;
  user1_id: string;
  user2_id: string;
  session_id: string;
  compatibility_score: number;
}

export interface MatchNotification {
  matchId: string;
  partnerId: string;
  sessionId: string;
}

export interface QueueJoinResponse {
  success: boolean;
  queuePosition?: number;
  estimatedWait?: number;
  error?: string;
}

export interface MatchActionResponse {
  success: boolean;
  error?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  native_language: string;
  target_languages: string[];
  age: number;
  gender: string;
  is_banned?: boolean;
}

export interface MatchingSocketData {
  userId: string;
  userEmail: string;
  userProfile: UserProfile;
}

// Socket.io event definitions for client-server communication
export interface SocketEvents {
  // Matching events
  'matching:join_queue': (preferences: MatchingPreferences, callback: (response: QueueJoinResponse) => void) => void;
  'matching:leave_queue': (callback: (response: MatchActionResponse) => void) => void;
  'matching:match_found': (data: MatchNotification) => void;
  'matching:accept_match': (data: { matchId: string; sessionId: string }, callback: (response: MatchActionResponse) => void) => void;
  'matching:reject_match': (data: { matchId: string }, callback: (response: MatchActionResponse) => void) => void;
  'matching:match_accepted': (data: { matchId: string; sessionId: string; acceptedBy: string }) => void;

  // WebRTC signaling events
  'webrtc:offer': (data: { sessionId: string; offer: RTCSessionDescriptionInit }) => void;
  'webrtc:answer': (data: { sessionId: string; answer: RTCSessionDescriptionInit }) => void;
  'webrtc:ice_candidate': (data: { sessionId: string; candidate: RTCIceCandidateInit }) => void;
  'webrtc:connection_ready': (data: { sessionId: string }) => void;

  // Connection events
  'heartbeat': (callback: (data: { timestamp: number }) => void) => void;
  'disconnect': (reason: string) => void;
}

export interface WebRTCSignaling {
  sessionId: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  from: string;
}