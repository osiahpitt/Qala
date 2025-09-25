'use client';

import { useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { MatchingInterface } from '@/components/matching/MatchingInterface';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, userProfile, loading, isEmailVerified } = useAuth();

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
            {/* Email Verification Banner */}
            {!isEmailVerified && (
              <div className="mb-6 bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.94-.833-2.71 0L3.104 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-200 font-medium text-sm mb-1">
                      Email verification required
                    </h3>
                    <p className="text-red-300 text-sm">
                      To start matching with language partners and access all features, please verify your email address.
                    </p>
                  </div>
                  <div>
                    <a
                      href="/auth/verify-email"
                      className="inline-flex items-center px-3 py-1.5 border border-red-600 text-xs font-medium rounded text-red-200 hover:bg-red-900/40 transition-colors"
                    >
                      Verify Email
                    </a>
                  </div>
                </div>
              </div>
            )}

            <header className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {hasCompletedProfile
                  ? `Welcome back, ${userProfile.fullName}!`
                  : `Welcome to QALA!`
                }
              </h1>
              {hasCompletedProfile ? (
                <p className="text-slate-400">
                  {isEmailVerified
                    ? `Ready to practice ${userProfile.targetLanguages?.[0] || 'your target language'} with native speakers?`
                    : `Complete your email verification to start matching with language partners.`
                  }
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