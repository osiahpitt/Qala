'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { WebRTCProvider } from '@/contexts/WebRTCContext';
import { VideoCallRoom } from '@/components/VideoCall/VideoCallRoom';

export default function CallPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (params.sessionId && typeof params.sessionId === 'string') {
      setSessionId(params.sessionId);
    } else {
      router.push('/dashboard');
    }
  }, [params.sessionId, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }

    if (!loading && user && !userProfile?.nativeLanguage) {
      router.push('/profile/setup');
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qala-gold"></div>
      </div>
    );
  }

  if (!user || !userProfile || !sessionId) {
    return null;
  }

  return (
    <SocketProvider>
      <WebRTCProvider>
        <VideoCallRoom sessionId={sessionId} />
      </WebRTCProvider>
    </SocketProvider>
  );
}