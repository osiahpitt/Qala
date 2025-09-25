'use client';

import { useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { MatchingInterface } from '@/components/matching/MatchingInterface';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, userProfile, loading, isEmailVerified } = useAuth();

  console.log('=== DASHBOARD DEBUG ===')
  console.log('Dashboard page rendering')
  console.log('Auth state:', { user: !!user, userProfile: !!userProfile, loading, isEmailVerified })

  // Removed redirect useEffect - let middleware handle authentication redirects
  // This prevents infinite redirect loops during auth state synchronization

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qala-gold" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has completed their profile
  const hasCompletedProfile = userProfile && userProfile.fullName && userProfile.nativeLanguage;

  return (
    <SocketProvider>
      <MatchingInterface />
    </SocketProvider>
  );
}