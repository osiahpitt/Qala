'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useWebRTC } from '@/contexts/WebRTCContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageDropdown } from './LanguageDropdown';
import { ProfileButton } from './ProfileButton';
import { CriteriaSelection } from './CriteriaSelection';
import { VideoPanel } from './VideoPanel';
import { ChatPanel } from './ChatPanel';
import { TranslatorBox } from './TranslatorBox';

interface VideoCallRoomProps {
  sessionId: string;
}

export const VideoCallRoom: React.FC<VideoCallRoomProps> = ({ sessionId }) => {
  const { userProfile } = useAuth();
  const {
    initializeCall,
    endCall,
    isConnecting,
    isConnected,
    connectionError,
    localStream,
    remoteStream,
    toggleVideo,
    toggleAudio,
    isVideoEnabled,
    isAudioEnabled,
  } = useWebRTC();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [callStarted, setCallStarted] = useState(false);

  useEffect(() => {
    if (!callStarted && userProfile) {
      // Determine if this user is the initiator
      // In a real implementation, this would be determined by the matching service
      // For now, we'll assume the first user to join is the initiator
      const initiator = true; // This should come from the matching service
      setIsInitiator(initiator);

      initializeCall(sessionId, initiator).catch((error) => {
        console.error('Failed to initialize call:', error);
      });

      setCallStarted(true);
    }
  }, [sessionId, userProfile, initializeCall, callStarted]);

  const handleEndCall = () => {
    endCall();
    // Redirect back to dashboard
    window.location.href = '/dashboard';
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Connection Error</h2>
          <p className="mb-6">{connectionError}</p>
          <button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-body">
      <div className="top-right-controls">
        <LanguageDropdown />
        <ProfileButton />
      </div>

      <div className="app-container">
        <header className="header-box">
          <h1>QALA Language Exchange</h1>
        </header>

        {!isConnected && (
          <CriteriaSelection userProfile={userProfile} />
        )}

        <main className="video-chat-container">
          <div className="video-panels" data-layout="side-by-side">
            <VideoPanel
              stream={localStream}
              isLocal={true}
              isVideoEnabled={isVideoEnabled}
              isAudioEnabled={isAudioEnabled}
              onToggleVideo={toggleVideo}
              onToggleAudio={toggleAudio}
            >
              <TranslatorBox />
            </VideoPanel>

            <VideoPanel
              stream={remoteStream}
              isLocal={false}
              isConnecting={isConnecting}
              isConnected={isConnected}
            />
          </div>

          {isConnected && (
            <div className="call-controls">
              <button
                onClick={toggleVideo}
                className={`control-btn ${isVideoEnabled ? 'active' : 'disabled'}`}
              >
                {isVideoEnabled ? '📹' : '📹❌'}
              </button>
              <button
                onClick={toggleAudio}
                className={`control-btn ${isAudioEnabled ? 'active' : 'disabled'}`}
              >
                {isAudioEnabled ? '🎤' : '🎤❌'}
              </button>
              <button
                onClick={handleEndCall}
                className="control-btn end-call"
              >
                📞❌
              </button>
            </div>
          )}
        </main>

        <div className="chat-toggle-container">
          <button
            id="chat-toggle-btn"
            onClick={toggleChat}
            aria-label="Toggle chat"
          >
            Chat
          </button>

          <ChatPanel
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            sessionId={sessionId}
          />
        </div>
      </div>
    </div>
  );
};