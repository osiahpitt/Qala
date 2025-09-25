'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import type { MatchingPreferences } from '@/types/matching';

// These are placeholder components - I'll need UI from you for these
const MatchingPreferencesForm = ({ onSubmit, loading }: {
  onSubmit: (preferences: MatchingPreferences) => void;
  loading: boolean;
}) => {
  // Placeholder - will need UI component from you
  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Set Your Preferences</h3>
      <p className="text-slate-400 mb-4">
        I need you to provide the UI component for the matching preferences form.
        This should include:
        - Language selection (native and target)
        - Age range preferences
        - Gender preference
        - Proficiency level
        - Submit button
      </p>
      <button
        onClick={() => {
          // Temporary mock data for testing
          onSubmit({
            userId: 'temp',
            native_language: 'en',
            target_language: 'es',
            age: 25,
            gender: 'any',
            proficiency_level: 'intermediate',
            age_min: 18,
            age_max: 35,
            gender_preference: 'any'
          });
        }}
        disabled={loading}
        className="bg-qala-gold hover:bg-qala-gold/90 disabled:opacity-50 text-slate-900 font-semibold py-2 px-4 rounded"
      >
        {loading ? 'Starting Search...' : 'Find Language Partner'}
      </button>
    </div>
  );
};

const QueueStatus = ({ position, estimatedWait, onLeave }: {
  position: number | null;
  estimatedWait: number | null;
  onLeave: () => void;
}) => {
  // Placeholder - will need UI component from you
  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Searching for Partner...</h3>
      <p className="text-slate-400 mb-4">
        I need you to provide the UI component for queue status.
        This should include:
        - Animated searching indicator
        - Queue position display
        - Estimated wait time
        - Cancel search button
      </p>
      <div className="space-y-2 text-white">
        {position && <p>Position in queue: {position}</p>}
        {estimatedWait && <p>Estimated wait: {Math.round(estimatedWait / 60)} minutes</p>}
      </div>
      <button
        onClick={onLeave}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
      >
        Cancel Search
      </button>
    </div>
  );
};

const MatchFoundModal = ({ match, onAccept, onReject }: {
  match: { matchId: string; partnerId: string; sessionId: string };
  onAccept: () => void;
  onReject: () => void;
}) => {
  // Placeholder - will need UI component from you
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-xl font-semibold text-white mb-4">Match Found!</h3>
        <p className="text-slate-400 mb-6">
          I need you to provide the UI component for match found notification.
          This should include:
          - Partner information preview
          - Accept/Reject buttons
          - Timer countdown
          - Attractive design
        </p>
        <div className="flex space-x-4">
          <button
            onClick={onAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
          >
            Accept Match
          </button>
          <button
            onClick={onReject}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export const MatchingInterface: React.FC = () => {
  const { userProfile, isEmailVerified } = useAuth();
  const {
    isConnected,
    connectionError,
    joinQueue,
    leaveQueue,
    queuePosition,
    estimatedWait,
    currentMatch,
    acceptMatch,
    rejectMatch
  } = useSocket();

  const [matchingState, setMatchingState] = useState<'idle' | 'searching' | 'matched'>('idle');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentMatch) {
      setMatchingState('matched');
    } else if (queuePosition !== null) {
      setMatchingState('searching');
    } else {
      setMatchingState('idle');
    }
  }, [currentMatch, queuePosition]);

  const handleStartMatching = async (preferences: MatchingPreferences) => {
    if (!userProfile) {return;}
    if (!isEmailVerified) {
      // Redirect to email verification
      window.location.href = '/auth/verify-email';
      return;
    }

    setLoading(true);
    try {
      // Update preferences with actual user data
      const completePreferences: MatchingPreferences = {
        ...preferences,
        userId: userProfile.id,
        native_language: userProfile.native_language,
        target_language: userProfile.target_languages[0],
        age: userProfile.age,
        gender: userProfile.gender,
      };

      const response = await joinQueue(completePreferences);
      if (!response.success) {
        console.error('Failed to join queue:', response.error);
        // Show error message to user
      }
    } catch (error) {
      console.error('Error starting match:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopMatching = async () => {
    setLoading(true);
    try {
      await leaveQueue();
    } catch (error) {
      console.error('Error leaving queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMatch = async () => {
    if (!currentMatch) {return;}

    setLoading(true);
    try {
      const response = await acceptMatch(currentMatch.matchId, currentMatch.sessionId);
      if (response.success) {
        // Redirect to video call interface
        window.location.href = `/call/${currentMatch.sessionId}`;
      } else {
        console.error('Failed to accept match:', response.error);
        // Show error message to user
        alert('Failed to accept match. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting match:', error);
      alert('An error occurred while accepting the match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMatch = async () => {
    if (!currentMatch) {return;}

    setLoading(true);
    try {
      await rejectMatch(currentMatch.matchId);
    } catch (error) {
      console.error('Error rejecting match:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected && connectionError) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-red-400 mb-2">Connection Error</h3>
        <p className="text-red-300">{connectionError}</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-2">Connecting...</h3>
        <p className="text-slate-400">Establishing connection to matching service...</p>
      </div>
    );
  }

  // Show email verification required state for unverified users
  if (!isEmailVerified) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Email Verification Required</h3>
        <p className="text-slate-400 mb-4">
          To start matching with language partners, you need to verify your email address first.
          This helps us ensure the safety and authenticity of our community.
        </p>
        <div className="flex items-center space-x-4">
          <a
            href="/auth/verify-email"
            className="bg-qala-gold hover:bg-qala-gold/90 text-slate-900 font-semibold py-2 px-4 rounded"
          >
            Verify Email Address
          </a>
          <div className="text-slate-500 text-sm">
            Required for matching and video calls
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {matchingState === 'idle' && (
        <MatchingPreferencesForm
          onSubmit={handleStartMatching}
          loading={loading}
        />
      )}

      {matchingState === 'searching' && (
        <QueueStatus
          position={queuePosition}
          estimatedWait={estimatedWait}
          onLeave={handleStopMatching}
        />
      )}

      {matchingState === 'matched' && currentMatch && (
        <MatchFoundModal
          match={currentMatch}
          onAccept={handleAcceptMatch}
          onReject={handleRejectMatch}
        />
      )}
    </div>
  );
};