'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { SignupForm } from '@/components/SignupForm'

export default function SignupPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Check Your Email
            </h1>
            <p className="text-foreground-muted mb-6">
              We&apos;ve sent a verification link to {emailAddress}.
              Click the link to verify your account and complete your profile.
            </p>
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-4xl w-full mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Join QALA
          </h1>
          <p className="text-foreground-muted">
            Create your account and start practicing languages with natives
          </p>
        </div>

        <SignupForm
          initialEmail={initialEmail}
          onSuccess={handleSuccess}
          onEmailConfirmationSent={handleEmailConfirmationSent}
        />
      </div>
    </div>
  )
}