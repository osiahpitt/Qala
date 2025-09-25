'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebRTC } from '@/contexts/WebRTCContext';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, sessionId }) => {
  const { userProfile } = useAuth();
  const { sendMessage, setDataMessageHandler } = useWebRTC();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up data message handler for chat
  useEffect(() => {
    const chatHandler = (data: any) => {
      if (data.type === 'chat' && data.message && data.senderId && data.senderName) {
        const newMessage: ChatMessage = {
          id: data.id || Date.now().toString(),
          senderId: data.senderId,
          senderName: data.senderName,
          message: data.message,
          timestamp: new Date(data.timestamp || Date.now()),
          isOwn: false,
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    setDataMessageHandler(chatHandler);

    // Cleanup on unmount
    return () => {
      setDataMessageHandler(undefined);
    };
  }, [setDataMessageHandler]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentMessage.trim() || !userProfile) {return;}

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: userProfile.id,
      senderName: userProfile.full_name,
      message: currentMessage.trim(),
      timestamp: new Date(),
      isOwn: true,
    };

    // Add to local messages
    setMessages(prev => [...prev, newMessage]);

    // Send via WebRTC data channel
    sendMessage({
      type: 'chat',
      id: newMessage.id,
      senderId: newMessage.senderId,
      senderName: newMessage.senderName,
      message: newMessage.message,
      timestamp: newMessage.timestamp.toISOString(),
    });

    setCurrentMessage('');
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {return null;}

  return (
    <aside className="text-chat-panel">
      <header className="chat-header">
        <h2>Text Chat</h2>
        <button
          id="close-chat-btn"
          aria-label="Close chat"
          onClick={onClose}
        >
          ×
        </button>
      </header>

      <div className="chat-messages" aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>Start a conversation! Messages will appear here.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${message.isOwn ? 'own-message' : 'partner-message'}`}
            >
              <div className="message-header">
                <span className="sender-name">
                  {message.isOwn ? 'You' : message.senderName}
                </span>
                <span className="message-time">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <div className="message-content">
                {message.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          maxLength={500}
          autoComplete="off"
        />
        <button type="submit" disabled={!currentMessage.trim()}>
          Send
        </button>
      </form>
    </aside>
  );
};