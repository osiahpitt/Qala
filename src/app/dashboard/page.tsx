'use client';

import { useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { MatchingInterface } from '@/components/matching/MatchingInterface';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      redirect('/auth/login');
    }

    if (!loading && user && !userProfile?.nativeLanguage) {
      redirect('/profile/setup');
    }
  }, [user, userProfile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qala-gold"></div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return null;
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-slate-900">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {userProfile.fullName}!
              </h1>
              <p className="text-slate-400">
                Ready to practice {userProfile.targetLanguages[0]} with native speakers?
              </p>
            </header>

            <MatchingInterface />
          </div>
        </main>
      </div>
    </SocketProvider>
  );
}