'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/auth'
import { passwordResetSchema, type PasswordReset } from '@/lib/schemas/user'
import { Button } from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<PasswordReset>({
    email: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleInputChange = (field: keyof PasswordReset, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsSubmitting(true)

    try {
      const validatedData = passwordResetSchema.parse(formData)
      const result = await resetPassword(validatedData.email)

      if (result.success) {
        setEmailSent(true)
      } else {
        setErrors({ submit: result.error || 'Failed to send reset email' })
      }
    } catch (error) {
      if (error instanceof Error && 'errors' in error) {
        const zodErrors = error as { errors: Array<{ path: string[]; message: string }> }
        const errorMap: Record<string, string> = {}
        zodErrors.errors.forEach(err => {
          if (err.path.length > 0) {
            errorMap[err.path[0]] = err.message
          }
        })
        setErrors(errorMap)
      } else {
        setErrors({ submit: 'Please enter a valid email address' })
      }
    } finally {
      setIsSubmitting(false)
    }
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
              We&apos;ve sent a password reset link to {formData.email}.
              Click the link in the email to reset your password.
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="inline-block text-primary hover:text-primary/80 font-medium"
              >
                Back to Login
              </Link>
              <div>
                <button
                  onClick={() => {
                    setEmailSent(false)
                    setFormData({ email: '' })
                  }}
                  className="text-sm text-foreground-muted hover:text-foreground"
                >
                  Try a different email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Reset Password
          </h1>
          <p className="text-foreground-muted">
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your email address"
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
            disabled={isSubmitting || !formData.email.trim()}
          >
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-foreground-muted hover:text-foreground text-sm"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}