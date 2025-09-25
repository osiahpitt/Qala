'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ManualSigninForm } from '@/components/ManualSigninForm'
import styles from '../signup/signup.module.css'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, loading } = useAuth()
  const [initialEmail, setInitialEmail] = useState('')
  const [message, setMessage] = useState('')
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const messageParam = searchParams.get('message')

    if (emailParam) {
      setInitialEmail(emailParam)
    }

    if (messageParam) {
      setMessage(messageParam)
    }
  }, [searchParams])

  // Handle redirect after authentication state updates
  useEffect(() => {
    if (shouldRedirect && isAuthenticated && user && !loading) {
      const redirectTo = searchParams.get('redirectTo') || '/dashboard'
      console.log('=== REDIRECT DEBUG ===')
      console.log('Auth state confirmed, redirecting to:', redirectTo)
      console.log('User:', !!user, 'Authenticated:', isAuthenticated, 'Loading:', loading)

      // Use window.location for reliable redirect
      window.location.href = redirectTo
    }
  }, [shouldRedirect, isAuthenticated, user, loading, searchParams])

  const handleSuccess = () => {
    console.log('=== SIGNIN SUCCESS ===')
    console.log('Authentication successful, waiting for auth state update...')
    setShouldRedirect(true)
  }

  return (
    <div className={styles.signupBody}>
      {message && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#e3f2fd',
          border: '1px solid #1976d2',
          borderRadius: '8px',
          color: '#1976d2',
          textAlign: 'center',
          fontSize: '0.95rem',
          fontWeight: '500'
        }}>
          {message}
        </div>
      )}
      <ManualSigninForm
        initialEmail={initialEmail}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.signupBody}>
          <div className={styles.signupContainer}>
            <div className={styles.signupBox}>
              <h1 className={styles.signupTitle}>Sign In to Qala</h1>
              <p style={{ color: '#64748b', fontSize: '1.1rem', textAlign: 'center' }}>
                Loading sign in form...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}