'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ManualSignupForm } from '@/components/ManualSignupForm'
import styles from './signup.module.css'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [emailSent, setEmailSent] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [initialEmail, setInitialEmail] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setInitialEmail(emailParam)
    }
  }, [searchParams])

  const handleEmailConfirmationSent = (email: string) => {
    setEmailAddress(email)
    setEmailSent(true)
  }

  const handleSuccess = () => {
    router.push('/profile/setup')
  }

  if (emailSent) {
    // Redirect to verification code page instead of showing email waiting page
    router.push(`/auth/verify-code?email=${encodeURIComponent(emailAddress)}`)
    return (
      <div className={styles.signupBody}>
        <div className={styles.signupContainer}>
          <div className={styles.signupBox}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #e5b567',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }} />
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                Redirecting to verification...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.signupBody}>
      <ManualSignupForm
        initialEmail={initialEmail}
        onSuccess={handleSuccess}
        onEmailConfirmationSent={handleEmailConfirmationSent}
      />
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.signupBody}>
          <div className={styles.signupContainer}>
            <div className={styles.signupBox}>
              <h1 className={styles.signupTitle}>Join QALA</h1>
              <p style={{ color: '#64748b', fontSize: '1.1rem', textAlign: 'center' }}>
                Loading signup form...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  )
}
