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
    router.push('/dashboard')
  }

  if (emailSent) {
    return (
      <div className={styles.signupBody}>
        <div className={styles.signupContainer}>
          <div className={styles.signupBox}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#e5b567',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 style={{
                color: '#1e293b',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}>
                Check Your Email
              </h2>
              <p style={{
                color: '#64748b',
                fontSize: '1rem',
                marginBottom: '20px',
                lineHeight: '1.5'
              }}>
                We've sent a verification code to <strong>{emailAddress}</strong>.
                Please check your inbox and click the button below to enter the code.
              </p>
              <button
                onClick={() => router.push(`/auth/verify-code?email=${encodeURIComponent(emailAddress)}`)}
                style={{
                  backgroundColor: '#e5b567',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d4a356'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e5b567'}
              >
                Enter Verification Code
              </button>
              <p style={{
                color: '#64748b',
                fontSize: '0.875rem',
                marginTop: '16px'
              }}>
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setEmailSent(false)}
                  style={{
                    color: '#e5b567',
                    background: 'none',
                    border: 'none',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  try again
                </button>
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
