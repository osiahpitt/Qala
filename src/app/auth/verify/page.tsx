'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createUserProfile } from '@/lib/auth'
import { useRouter } from 'next/navigation'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token || type !== 'signup') {
          throw new Error('Invalid verification link')
        }

        // Verify the token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        })

        if (error) {
          throw new Error(error.message)
        }

        if (data.user) {
          // Create user profile
          await createUserProfile(data.user)
          setStatus('success')

          // Redirect to profile setup
          setTimeout(() => {
            router.push('/profile/setup')
          }, 2000)
        }
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Verification failed')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6 text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verifying Your Email
            </h1>
            <p className="text-foreground-muted">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Email Verified!
            </h1>
            <p className="text-foreground-muted">
              Your email has been successfully verified. Redirecting to profile setup...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verification Failed
            </h1>
            <p className="text-foreground-muted mb-4">
              {error || 'There was an error verifying your email address.'}
            </p>
            <button
              onClick={() => router.push('/auth/signup')}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-auto p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Loading verification...
            </h1>
            <p className="text-foreground-muted">
              Please wait while we prepare the verification page...
            </p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}