'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createUserProfile } from '@/lib/auth'
import { AUTH_DELAYS } from '@/lib/constants'

type CallbackState = 'loading' | 'success' | 'error' | 'profile_creation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<CallbackState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error: authError } = await supabase.auth.getSession()

        if (authError) {
          throw new Error(authError.message)
        }

        if (!data.session || !data.session.user) {
          throw new Error('No session found')
        }

        const user = data.session.user

        // Check if this is a new user by looking at user metadata
        const isNewUser = user.user_metadata?.new_user === true ||
                          user.email_confirmed_at && !user.user_metadata?.profile_created

        if (isNewUser) {
          setState('profile_creation')

          // Attempt to create user profile
          const profileCreated = await createUserProfile(user)

          if (profileCreated) {
            // Redirect to profile setup for new users
            router.push('/profile/setup')
            return
          } else {
            // If profile creation failed, still redirect to setup - they can try again
            router.push('/profile/setup')
            return
          }
        }

        // For existing users, redirect to dashboard
        setState('success')
        setTimeout(() => {
          router.push('/dashboard')
        }, AUTH_DELAYS.SUCCESS_REDIRECT_DELAY)

      } catch (err) {
        setState('error')
        setError(err instanceof Error ? err.message : 'Authentication failed')

        // Redirect to login after error
        setTimeout(() => {
          router.push('/auth/login?error=callback_failed')
        }, AUTH_DELAYS.ERROR_REDIRECT_DELAY)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verifying Your Account
            </h1>
            <p className="text-foreground-muted">
              Please wait while we complete your authentication...
            </p>
          </div>
        )

      case 'profile_creation':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Setting Up Your Profile
            </h1>
            <p className="text-foreground-muted">
              Creating your QALA profile...
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Welcome Back!
            </h1>
            <p className="text-foreground-muted">
              You have been successfully signed in. Redirecting to your dashboard...
            </p>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Authentication Failed
            </h1>
            <p className="text-foreground-muted mb-4">
              {error || 'There was an error processing your authentication. Please try again.'}
            </p>
            <p className="text-sm text-foreground-muted">
              Redirecting to login page...
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        {renderContent()}
      </div>
    </div>
  )
}