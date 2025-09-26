'use client';

import { useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { MatchingInterface } from '@/components/matching/MatchingInterface';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, userProfile, loading, isEmailVerified } = useAuth();
  const [showContent, setShowContent] = useState(false);

  // NUCLEAR SOLUTION: Show content after brief delay, don't wait forever for auth state
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000); // Give auth state 2 seconds, then show content anyway

    return () => clearTimeout(timer);
  }, []);

  // Show content if auth is ready OR if timeout elapsed
  const shouldShowContent = (!loading && user) || showContent;

  if (!shouldShowContent) {
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