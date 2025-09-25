'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { type UserRegistration } from '@/lib/schemas/user'
import styles from '@/app/auth/signup/signup.module.css'

const MIN_PASSWORD_LENGTH = 8

export interface ManualSignupFormProps {
  initialEmail?: string
  onSuccess?: () => void
  onEmailConfirmationSent?: (email: string) => void
}

export function ManualSignupForm({
  initialEmail,
  onSuccess,
  onEmailConfirmationSent,
}: ManualSignupFormProps) {
  const { signUp: authSignUp, signInWithGoogle } = useAuth()

  const [formData, setFormData] = useState({
    email: initialEmail || '',
    password: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Update email when initialEmail prop changes
  useEffect(() => {
    if (initialEmail && initialEmail !== formData.email) {
      setFormData(prev => ({ ...prev, email: initialEmail }))
    }
  }, [initialEmail, formData.email])

  const validateForm = (): boolean => {
    const formErrors: Record<string, string> = {}

    if (!formData.email?.trim()) {
      formErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      formErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password?.trim()) {
      formErrors.password = 'Password is required'
    } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
      formErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    }

    setErrors(formErrors)
    return Object.keys(formErrors).length === 0
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      // Create minimal user data for registration - we'll collect the rest later
      const userData: UserRegistration = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.password, // Same as password for manual signup
        fullName: '', // Will be collected in profile setup
        nativeLanguage: 'en', // Default - will be collected in profile setup
        targetLanguages: ['es'], // Default - will be collected in profile setup
        age: 18, // Default - will be collected in profile setup
        country: 'USA', // Default - will be collected in profile setup
        timezone:
          typeof window !== 'undefined'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : 'America/New_York',
        termsAccepted: true, // Implied acceptance for manual signup
        privacyAccepted: true, // Implied acceptance for manual signup
      }

      const result = await authSignUp(userData)

      if (result.success) {
        if (result.emailConfirmationSent) {
          onEmailConfirmationSent?.(formData.email)
        } else {
          onSuccess?.()
        }
      } else {
        // Handle specific error cases for existing users
        const errorMessage = result.error || 'Signup failed'

        if (errorMessage.includes('User already registered') ||
            errorMessage.includes('already registered') ||
            errorMessage.includes('already exists')) {
          setErrors({
            email: 'An account with this email already exists.',
            submit: 'Please use the sign-in page to access your account.'
          })
        } else if (errorMessage.includes('Email not confirmed') ||
                   errorMessage.includes('not confirmed')) {
          setErrors({
            email: 'This email needs verification.',
            submit: 'Please check your email and verify your account first.'
          })
        } else {
          setErrors({ submit: errorMessage })
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please check your inputs and try again'

      // Handle specific error cases
      if (errorMessage.includes('User already registered') ||
          errorMessage.includes('already registered') ||
          errorMessage.includes('already exists')) {
        setErrors({
          email: 'An account with this email already exists.',
          submit: 'Please use the sign-in page to access your account.'
        })
      } else {
        setErrors({ submit: errorMessage })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true)
      setErrors({})

      const result = await signInWithGoogle()

      if (!result.success) {
        setErrors({ submit: result.error || 'Google signup failed' })
      }
      // If successful, the user will be redirected by Google OAuth
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Google signup failed' })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <main className={styles.signupContainer} role="main">
      <section className={styles.signupBox} aria-labelledby="signup-header">
        <h1 id="signup-header" className={styles.signupTitle}>
          Create Qala Account
        </h1>

        <form className={styles.signupForm} onSubmit={handleSubmit} autoComplete="off">
          <button
            type="button"
            className={styles.googleSigninBtn}
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading || isSubmitting}
            aria-label="Sign up with Google"
          >
            {isGoogleLoading ? (
              <div className={styles.spinner} />
            ) : (
              <Image
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt=""
                width={20}
                height={20}
              />
            )}
            Sign up with Google
          </button>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <div>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              autoComplete="email"
              placeholder="name@email.com"
              aria-required="true"
              className={`${styles.input} ${errors.email ? styles.error : ''}`}
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
            />
            {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
          </div>

          <div>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              aria-required="true"
              className={`${styles.input} ${errors.password ? styles.error : ''}`}
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
            />
            {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
          </div>

          <button
            type="submit"
            className={styles.signupBtn}
            disabled={isSubmitting || isGoogleLoading}
            aria-label="Complete signup"
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner} />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          {errors.submit && (
            <div className={styles.errorMessage} style={{ textAlign: 'center', marginTop: '1rem' }}>
              {errors.submit}
            </div>
          )}
        </form>

        {(errors.email?.includes('already exists') || errors.submit?.includes('sign-in page')) && (
          <div style={{
            textAlign: 'center',
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            color: '#856404'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '500' }}>
              Account found with this email
            </p>
            <Link
              href={`/auth/login${formData.email ? `?email=${encodeURIComponent(formData.email)}` : ''}`}
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                backgroundColor: '#d39e00',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
            >
              Sign In Instead
            </Link>
          </div>
        )}

        <div className={styles.loginLink}>
          Already have an account? <Link href="/auth/login">Sign in</Link>
        </div>
      </section>
    </main>
  )
}
