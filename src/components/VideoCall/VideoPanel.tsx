'use client';

import React, { useEffect, useRef } from 'react';

interface VideoPanelProps {
  stream: MediaStream | null;
  isLocal: boolean;
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
  isConnecting?: boolean;
  isConnected?: boolean;
  onToggleVideo?: () => void;
  onToggleAudio?: () => void;
  children?: React.ReactNode;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({
  stream,
  isLocal,
  isVideoEnabled = true,
  isAudioEnabled = true,
  isConnecting = false,
  isConnected = false,
  onToggleVideo,
  onToggleAudio,
  children,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const getStatusText = () => {
    if (isLocal) {
      return 'You';
    }
    if (isConnecting) {
      return 'Connecting...';
    }
    if (!isConnected) {
      return 'Waiting for partner...';
    }
    return 'Partner';
  };

  const getVideoClasses = () => {
    let classes = 'video-panel';
    if (isLocal) {
      classes += ' user-video';
    } else {
      classes += ' partner-video';
    }
    return classes;
  };

  return (
    <div className={getVideoClasses()} style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Mute local video to prevent echo
      />

      {/* Video overlay for status */}
      <div className="video-overlay">
        <div className="video-status">
          {getStatusText()}
        </div>

        {/* Connection status indicator */}
        {!isLocal && (
          <div className="connection-indicator">
            {isConnecting && (
              <div className="connecting-spinner">
                <div className="spinner" />
              </div>
            )}
            {isConnected && (
              <div className="connected-indicator">🟢</div>
            )}
          </div>
        )}

        {/* Local video controls */}
        {isLocal && onToggleVideo && onToggleAudio && (
          <div className="video-controls">
            <button
              onClick={onToggleVideo}
              className={`control-btn ${isVideoEnabled ? 'enabled' : 'disabled'}`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? '📹' : '📹❌'}
            </button>
            <button
              onClick={onToggleAudio}
              className={`control-btn ${isAudioEnabled ? 'enabled' : 'disabled'}`}
              title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isAudioEnabled ? '🎤' : '🎤❌'}
            </button>
          </div>
        )}
      </div>

      {/* Children (e.g., TranslatorBox for local video) */}
      {children}
    </div>
  );
};