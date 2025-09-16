'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resendConfirmation } from '@/lib/auth'
import { Button } from '@/components/ui/Button'

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setResendError('Please enter your email address')
      return
    }

    setIsResending(true)
    setResendError('')
    setResendSuccess(false)

    try {
      const result = await resendConfirmation(email)

      if (result.success) {
        setResendSuccess(true)
      } else {
        setResendError(result.error || 'Failed to resend verification email')
      }
    } catch (_error) {
      setResendError('Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Verify Your Email
          </h1>
          <p className="text-foreground-muted">
            We&apos;ve sent a verification link to your email address. Click the link to verify your account and complete your registration.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                Check your spam folder
              </h3>
              <p className="text-sm text-blue-700">
                If you don&apos;t see the email in your inbox, please check your spam or junk folder.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">
              Didn&apos;t receive the email?
            </h3>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setResendError('')
                }}
                placeholder="Enter your email address"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />

              {resendSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600">
                    ✓ Verification email sent successfully!
                  </p>
                </div>
              )}

              {resendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{resendError}</p>
                </div>
              )}

              <Button
                onClick={handleResendVerification}
                loading={isResending}
                disabled={isResending || !email.trim()}
                className="w-full"
                variant="outline"
              >
                Resend Verification Email
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="text-center space-y-2">
              <Link
                href="/auth/login"
                className="block text-primary hover:text-primary/80 font-medium"
              >
                Back to Login
              </Link>
              <Link
                href="/auth/signup"
                className="block text-foreground-muted hover:text-foreground text-sm"
              >
                Create a different account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}