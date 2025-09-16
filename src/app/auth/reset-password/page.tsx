'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { updatePassword } from '@/lib/auth'
import { newPasswordSchema, type NewPassword } from '@/lib/schemas/user'
import { Button } from '@/components/ui/Button'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState<NewPassword>({
    password: '',
    confirmPassword: '',
    token: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setFormData(prev => ({ ...prev, token }))
    } else {
      setErrors({ token: 'Invalid or missing reset token' })
    }
  }, [searchParams])

  const handleInputChange = (field: keyof NewPassword, value: string) => {
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
      const validatedData = newPasswordSchema.parse(formData)
      const result = await updatePassword(validatedData.password)

      if (result.success) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } else {
        setErrors({ submit: result.error || 'Failed to update password' })
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
        setErrors({ submit: 'Please check your inputs and try again' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Password Updated
            </h1>
            <p className="text-foreground-muted mb-6">
              Your password has been successfully updated. You will be redirected to the login page in a few seconds.
            </p>
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Go to Login Now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (errors.token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Invalid Reset Link
            </h1>
            <p className="text-foreground-muted mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/forgot-password"
                className="inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90"
              >
                Request New Reset Link
              </Link>
              <div>
                <Link
                  href="/auth/login"
                  className="text-foreground-muted hover:text-foreground text-sm"
                >
                  Back to Login
                </Link>
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
            Set New Password
          </h1>
          <p className="text-foreground-muted">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              New Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your new password"
              required
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-foreground-muted">
              Password must contain at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Confirm your new password"
              required
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
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
            disabled={isSubmitting || !formData.password || !formData.confirmPassword}
          >
            Update Password
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