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
  }, [user, loading]);

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
      <div className="min-h-screen bg-slate-900">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {hasCompletedProfile
                  ? `Welcome back, ${userProfile.fullName}!`
                  : `Welcome to QALA!`
                }
              </h1>
              {hasCompletedProfile ? (
                <p className="text-slate-400">
                  Ready to practice {userProfile.targetLanguages?.[0] || 'your target language'} with native speakers?
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-400">
                    Let's get you set up to start practicing with native speakers around the world.
                  </p>
                  <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-amber-200 text-sm">
                          For the best matching experience, we recommend completing your profile first.
                        </p>
                      </div>
                      <div>
                        <a
                          href="/profile/setup"
                          className="inline-flex items-center px-3 py-1.5 border border-amber-600 text-xs font-medium rounded text-amber-200 hover:bg-amber-900/40 transition-colors"
                        >
                          Complete Profile
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </header>

            <MatchingInterface />
          </div>
        </main>
      </div>
    </SocketProvider>
  );
}