'use client';

import { useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { MatchingInterface } from '@/components/matching/MatchingInterface';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, userProfile, loading, isEmailVerified } = useAuth();

  // Dashboard rendering with auth state

  // Let middleware handle authentication redirects
  // Only show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qala-gold" />
      </div>
    );
  }

  // If not authenticated after loading is complete, let middleware redirect
  // Don't return null immediately as this causes flash/blink issues
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qala-gold" />
      </div>
    );
  }

  return (
    <SocketProvider>
      <MatchingInterface />
    </SocketProvider>
  );
}