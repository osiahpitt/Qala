'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createUserProfile } from '@/lib/auth'
import { useRouter } from 'next/navigation'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'legacy'>('verifying')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token || type !== 'signup') {
          throw new Error('Invalid verification link')
        }

        // Try to verify the token (this will work for newer tokens)
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        })

        if (error) {
          // Check if this is a legacy token issue
          if (error.message.includes('invalid') || error.message.includes('expired') || error.message.includes('requested path is invalid')) {
            // This is likely a legacy token that's no longer compatible
            setStatus('legacy')
            return
          }
          throw new Error(error.message)
        }

        if (data.user) {
          // Create user profile
          await createUserProfile(data.user)
          setStatus('success')

          // Redirect to profile setup
          const REDIRECT_DELAY = 2000
          setTimeout(() => {
            router.push('/profile/setup')
          }, REDIRECT_DELAY)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed'

        // Check for legacy token patterns in error messages
        if (errorMessage.includes('invalid') || errorMessage.includes('expired') || errorMessage.includes('requested path is invalid')) {
          setStatus('legacy')
        } else {
          setStatus('error')
          setError(errorMessage)
        }
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

        {status === 'legacy' && (
          <>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verification Link Expired
            </h1>
            <p className="text-foreground-muted mb-4">
              This verification link is from an older email and is no longer valid.
              Don&apos;t worry - we can send you a new verification code.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/auth/verify-email')}
                className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 font-medium"
              >
                Get New Verification Code
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium"
                >
                  Back to Login
                </button>
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium"
                >
                  Create Account
                </button>
              </div>
            </div>
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