'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ManualSigninForm } from '@/components/ManualSigninForm'
import styles from '../signup/signup.module.css'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [initialEmail, setInitialEmail] = useState('')
  const [message, setMessage] = useState('')

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

  const handleSuccess = () => {
    // Check if there's a redirect URL from middleware
    const redirectTo = searchParams.get('redirectTo') || '/dashboard'
    router.push(redirectTo)
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