'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createUserProfile } from '@/lib/auth'
import { AUTH_DELAYS } from '@/lib/constants'

type CallbackState = 'loading' | 'success' | 'error' | 'profile_creation'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<CallbackState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback - URL:', window.location.href)
        console.log('Search params:', Object.fromEntries(searchParams.entries()))
        console.log('Hash:', window.location.hash)

        // Let Supabase handle the session automatically
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          throw new Error(error.message)
        }

        if (session && session.user) {
          console.log('Found session:', session.user.email)
          const user = session.user

          // Check if this is a new user (email just verified)
          const isNewUser = !user.user_metadata?.profile_created

          if (isNewUser) {
            setState('profile_creation')

            // Create user profile for new verified user
            const profileCreated = await createUserProfile(user)

            if (profileCreated) {
              router.push('/profile/setup')
              return
            } else {
              router.push('/profile/setup')
              return
            }
          } else {
            // Existing user, redirect to dashboard
            setState('success')
            setTimeout(() => {
              router.push('/dashboard')
            }, 1000)
            return
          }
        }

        // If no session yet, check for auth parameters
        const code = searchParams.get('code')
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')

        // Handle auth code flow
        if (code) {
          console.log('Found auth code, exchanging for session')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            throw new Error(exchangeError.message)
          }

          if (data.session && data.session.user) {
            const user = data.session.user
            setState('profile_creation')

            const profileCreated = await createUserProfile(user)
            router.push('/profile/setup')
            return
          }
        }

        // Handle direct token flow (legacy)
        if (accessToken && refreshToken) {
          console.log('Found tokens, setting session')
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('Token session error:', sessionError)
            throw new Error(sessionError.message)
          }

          if (data.session && data.session.user) {
            const user = data.session.user
            setState('profile_creation')

            const profileCreated = await createUserProfile(user)
            router.push('/profile/setup')
            return
          }
        }

        // Check hash parameters as fallback
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const hashAccessToken = hashParams.get('access_token')
        const hashRefreshToken = hashParams.get('refresh_token')

        if (hashAccessToken && hashRefreshToken) {
          console.log('Found hash tokens, setting session')
          const { data, error: hashSessionError } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken
          })

          if (hashSessionError) {
            console.error('Hash session error:', hashSessionError)
            throw new Error(hashSessionError.message)
          }

          if (data.session && data.session.user) {
            const user = data.session.user
            setState('profile_creation')

            const profileCreated = await createUserProfile(user)
            router.push('/profile/setup')
            return
          }
        }

        throw new Error('No valid authentication data found')

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Loading...
            </h1>
            <p className="text-foreground-muted">
              Please wait while we process your authentication...
            </p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}