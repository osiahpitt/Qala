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
    return (
      <div className={styles.signupBody}>
        <div className={styles.signupContainer}>
          <div className={styles.signupBox}>
            <h1 className={styles.signupTitle}>Check Your Email</h1>
            <p
              style={{
                color: '#64748b',
                fontSize: '1.1rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
              }}
            >
              We&apos;ve sent a verification link to {emailAddress}. Click the link to verify your
              account and complete your profile.
            </p>
            <Link
              href="/auth/login"
              style={{
                color: '#3b3a2f',
                fontWeight: '600',
                textDecoration: 'none',
                fontSize: '1rem',
              }}
            >
              Back to Login
            </Link>
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
