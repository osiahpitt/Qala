'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyEmail, resendConfirmation } from '@/lib/auth'
import { Button } from '@/components/ui/Button'

function VerifyCodeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailFromUrl)
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const handleVerifyCode = async () => {
    if (!email.trim() || !code.trim()) {
      setError('Please enter both email and verification code')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const result = await verifyEmail(email, code)

      if (result.success) {
        setSuccess(true)
        // Redirect to dashboard after successful verification
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError(result.error || 'Verification failed')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    setIsResending(true)
    setError('')
    setResendMessage('')

    try {
      const result = await resendConfirmation(email)

      if (result.success) {
        setResendMessage('New verification code sent to your email!')
      } else {
        setError(result.error || 'Failed to resend code')
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Email Verified!
          </h1>
          <p className="text-foreground-muted">
            Your email has been successfully verified. Redirecting to dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Verify Your Email
          </h1>
          <p className="text-foreground-muted">
            Enter the verification code sent to your email address.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              placeholder="Enter your email address"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              disabled={!!emailFromUrl}
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                setError('')
              }}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-center text-2xl tracking-widest"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {resendMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{resendMessage}</p>
            </div>
          )}

          <Button
            onClick={handleVerifyCode}
            loading={isVerifying}
            disabled={isVerifying || !email.trim() || !code.trim()}
            className="w-full"
          >
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </Button>

          <div className="text-center pt-4">
            <p className="text-sm text-foreground-muted mb-2">
              Didn&apos;t receive the code?
            </p>
            <button
              onClick={handleResendCode}
              disabled={isResending}
              className="text-primary hover:text-primary/80 font-medium text-sm disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend verification code'}
            </button>
          </div>

          <div className="pt-4 border-t border-border text-center">
            <button
              onClick={() => router.push('/auth/login')}
              className="text-foreground-muted hover:text-foreground text-sm"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyCodePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-auto p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Verify Your Email
            </h1>
            <p className="text-foreground-muted">
              Loading verification form...
            </p>
          </div>
        </div>
      }
    >
      <VerifyCodeContent />
    </Suspense>
  )
}