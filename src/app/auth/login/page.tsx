'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ManualSigninForm } from '@/components/ManualSigninForm'
import styles from '../signup/signup.module.css'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [initialEmail, setInitialEmail] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setInitialEmail(emailParam)
    }
  }, [searchParams])

  const handleSuccess = () => {
    router.push('/dashboard')
  }

  return (
    <div className={styles.signupBody}>
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