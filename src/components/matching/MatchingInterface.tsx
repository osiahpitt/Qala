'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TranslatorBox } from '@/components/VideoCall/TranslatorBox';
import { useMediaPermissions } from '@/hooks/useMediaPermissions';
import { PeerConnectionManager } from '@/lib/webrtc/PeerConnection';
import type { MatchingPreferences, SupportedLanguage, ProficiencyLevel } from '@/types';

interface LanguageDropdownProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'partner';
  content: string;
  timestamp: Date;
}

interface MatchingCriteria {
  nativeLanguage: string;
  targetLanguage: string;
  ageRange: string;
  gender: string;
  proficiency: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ru', name: 'Russian' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];
const GENDER_OPTIONS = ['Any', 'Male', 'Female', 'Other'];
const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Native'];

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ currentLanguage, onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangName = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage)?.name || 'English';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="dropdown language-dropdown" tabIndex={0} ref={dropdownRef}>
      <button
        className="dropdown-btn"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        Language: {currentLangName} ▾
      </button>
      <ul
        className="dropdown-menu"
        role="listbox"
        hidden={!isOpen}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <li
            key={lang.code}
            role="option"
            tabIndex={0}
            data-lang={lang.code}
            aria-selected={currentLanguage === lang.code}
            onClick={() => {
              onLanguageChange(lang.code);
              setIsOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onLanguageChange(lang.code);
                setIsOpen(false);
              }
            }}
          >
            {lang.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const MatchingInterface: React.FC = () => {
  // State management
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [matchingCriteria, setMatchingCriteria] = useState<MatchingCriteria>({
    nativeLanguage: '',
    targetLanguage: '',
    ageRange: '',
    gender: '',
    proficiency: ''
  });
  const [isMatching, setIsMatching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');

  // Refs
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const peerConnectionRef = useRef<PeerConnectionManager | null>(null);

  // Hooks
  const { requestPermissions, stream, stopStream, error: mediaError } = useMediaPermissions();

  // Initialize peer connection
  const initializePeerConnection = useCallback((isInitiator: boolean = false) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.destroy();
    }

    peerConnectionRef.current = new PeerConnectionManager(isInitiator);

    peerConnectionRef.current.on('stream', (remoteStream) => {
      if (partnerVideoRef.current) {
        partnerVideoRef.current.srcObject = remoteStream;
      }
    });

    peerConnectionRef.current.on('connect', () => {
      setConnectionStatus('connected');
      setIsConnected(true);
    });

    peerConnectionRef.current.on('error', (error) => {
      // WebRTC connection error occurred
      setConnectionStatus('failed');
    });

    peerConnectionRef.current.on('close', () => {
      setConnectionStatus('idle');
      setIsConnected(false);
    });
  }, []);

  // Initialize media stream
  const initializeMedia = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      const mediaStream = await requestPermissions();

      if (mediaStream && userVideoRef.current) {
        userVideoRef.current.srcObject = mediaStream;
      }

      return mediaStream;
    } catch (error) {
      // Failed to initialize media
      setConnectionStatus('failed');
      return null;
    }
  }, [requestPermissions]);

  // Handle matching form submission
  const handleStartMatching = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matchingCriteria.nativeLanguage || !matchingCriteria.targetLanguage) {
      alert('Please select both native and target languages');
      return;
    }

    setIsMatching(true);
    const mediaStream = await initializeMedia();

    if (mediaStream) {
      initializePeerConnection(true);
      // TODO: Implement matching logic with backend
      // Starting matching with criteria
    } else {
      setIsMatching(false);
    }
  };

  // Handle chat message submission
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // TODO: Send message through WebRTC data channel
    if (peerConnectionRef.current) {
      peerConnectionRef.current.sendData({
        type: 'chat',
        message: newMessage.content,
        timestamp: newMessage.timestamp
      });
    }
  };

  // Handle criteria changes
  const handleCriteriaChange = (field: keyof MatchingCriteria, value: string) => {
    setMatchingCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.destroy();
      }
      stopStream();
    };
  }, [stopStream]);

  return (
    <div className="video-call-body">
      {/* Top-right controls */}
      <div className="top-right-controls">
        <LanguageDropdown
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />
        <button className="profile-btn" type="button">
          Profile
        </button>
      </div>

      {/* Main app container */}
      <div className="app-container">
        {/* Header */}
        <header className="header-box">
          <h1>QALA Language Exchange</h1>
        </header>

        {/* Criteria selection */}
        <section className="criteria-selection">
          <div className="criteria-tab">Preferred Language Partner</div>
          <form onSubmit={handleStartMatching}>
            <div className="form-row">
              <label htmlFor="native-language">Native Language</label>
              <select
                id="native-language"
                name="native-language"
                required
                value={matchingCriteria.nativeLanguage}
                onChange={(e) => handleCriteriaChange('nativeLanguage', e.target.value)}
              >
                <option value="" disabled>Select</option>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="target-language">Target Language</label>
              <select
                id="target-language"
                name="target-language"
                required
                value={matchingCriteria.targetLanguage}
                onChange={(e) => handleCriteriaChange('targetLanguage', e.target.value)}
              >
                <option value="" disabled>Select</option>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="age">Age</label>
              <select
                id="age"
                name="age"
                value={matchingCriteria.ageRange}
                onChange={(e) => handleCriteriaChange('ageRange', e.target.value)}
              >
                <option value="" disabled>Select</option>
                {AGE_RANGES.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={matchingCriteria.gender}
                onChange={(e) => handleCriteriaChange('gender', e.target.value)}
              >
                <option value="" disabled>Select</option>
                {GENDER_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="proficiency">Proficiency Level</label>
              <select
                id="proficiency"
                name="proficiency"
                value={matchingCriteria.proficiency}
                onChange={(e) => handleCriteriaChange('proficiency', e.target.value)}
              >
                <option value="" disabled>Select</option>
                {PROFICIENCY_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <button
                type="submit"
                disabled={isMatching || !matchingCriteria.nativeLanguage || !matchingCriteria.targetLanguage}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isMatching ? '#666' : '#f9b700',
                  color: isMatching ? '#ccc' : 'black',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: isMatching ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
              >
                {isMatching ? 'Matching...' : 'Start Matching'}
              </button>
            </div>
          </form>
        </section>

        {/* Video chat container */}
        <main className="video-chat-container">
          <div className="video-panels" data-layout="side-by-side">
            {/* User video panel */}
            <div className="video-panel user-video" style={{ position: 'relative' }}>
              <video
                ref={userVideoRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  backgroundColor: '#000',
                  borderRadius: '14px 14px 0 0'
                }}
              />

              {/* Connection status overlay */}
              {connectionStatus !== 'idle' && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}>
                  {connectionStatus === 'connecting' && '🔄 Connecting...'}
                  {connectionStatus === 'connected' && '🟢 Connected'}
                  {connectionStatus === 'failed' && '🔴 Connection Failed'}
                </div>
              )}

              {/* Translator box */}
              <TranslatorBox />
            </div>

            {/* Partner video panel */}
            <div className="video-panel partner-video">
              <video
                ref={partnerVideoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  backgroundColor: '#000',
                  borderRadius: '14px 14px 0 0'
                }}
              />

              {/* Waiting for partner overlay */}
              {!isConnected && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: '#ccc',
                  fontSize: '1.1rem'
                }}>
                  {isMatching ? 'Waiting for partner...' : 'Start matching to connect'}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Chat toggle */}
      <div className="chat-toggle-container">
        <button
          id="chat-toggle-btn"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          Chat
        </button>

        <aside className={`text-chat-panel ${isChatOpen ? '' : 'hidden'}`}>
          <header className="chat-header">
            <h2>Text Chat</h2>
            <button
              id="close-chat-btn"
              aria-label="Close chat"
              onClick={() => setIsChatOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="chat-messages" aria-live="polite" ref={chatMessagesRef}>
            {chatMessages.length === 0 ? (
              <div className="chat-empty">No messages yet. Start the conversation!</div>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message ${message.sender === 'user' ? 'own-message' : 'partner-message'}`}
                >
                  <div className="message-header">
                    <span className="sender-name">
                      {message.sender === 'user' ? 'You' : 'Partner'}
                    </span>
                    <span className="message-time">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))
            )}
          </div>

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" disabled={!chatInput.trim()}>
              Send
            </button>
          </form>
        </aside>
      </div>

      {/* Error display */}
      {mediaError && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#dc2626',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          zIndex: 1000,
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          {mediaError}
        </div>
      )}
    </div>
  );
};