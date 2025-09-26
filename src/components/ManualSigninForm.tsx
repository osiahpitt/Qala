'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { loginSchema } from '@/lib/schemas/user'
import styles from '@/app/auth/signup/signup.module.css'

const MIN_PASSWORD_LENGTH = 8

export interface ManualSigninFormProps {
  initialEmail?: string
  onSuccess?: () => void
}

export function ManualSigninForm({
  initialEmail,
  onSuccess,
}: ManualSigninFormProps) {
  const { signIn, signInWithGoogle } = useAuth()

  const [formData, setFormData] = useState({
    email: initialEmail || '',
    password: '',
    rememberMe: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Update email when initialEmail prop changes
  useEffect(() => {
    if (initialEmail && initialEmail !== formData.email) {
      setFormData(prev => ({ ...prev, email: initialEmail }))
    }
  }, [initialEmail, formData.email])

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
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
      const validatedData = loginSchema.parse(formData)
      const result = await signIn(validatedData)

      if (result.success) {
        // Show redirecting state and call success immediately
        setIsSubmitting(false)
        setIsRedirecting(true)

        onSuccess?.()

        // Reset redirecting state after a brief delay
        setTimeout(() => {
          setIsRedirecting(false)
        }, 3000)
      } else {
        setErrors({ submit: result.error || 'Sign in failed' })
        setIsSubmitting(false)
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
        setErrors({ submit: 'Please check your credentials and try again' })
      }
      setIsSubmitting(false)
    }
    // Note: We handle setIsSubmitting(false) explicitly above to manage different states properly
  }

  const handleGoogleSignin = async () => {
    try {
      setIsGoogleLoading(true)
      setErrors({})

      const result = await signInWithGoogle()

      if (!result.success) {
        setErrors({ submit: result.error || 'Google sign in failed' })
      }
      // If successful, the user will be redirected by Google OAuth
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Google sign in failed' })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <main className={styles.signupContainer} role="main">
      <section className={styles.signupBox} aria-labelledby="signin-header">
        <h1 id="signin-header" className={styles.signupTitle}>
          Sign In
        </h1>

        <form className={styles.signupForm} onSubmit={handleSubmit} autoComplete="off">
          <button
            type="button"
            className={styles.googleSigninBtn}
            onClick={handleGoogleSignin}
            disabled={isGoogleLoading || isSubmitting || isRedirecting}
            aria-label="Sign in with Google"
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
            Sign in with Google
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
              disabled={isSubmitting || isRedirecting}
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
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-required="true"
              className={`${styles.input} ${errors.password ? styles.error : ''}`}
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              disabled={isSubmitting || isRedirecting}
            />
            {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                disabled={isSubmitting || isRedirecting}
                style={{
                  marginRight: '0.5rem',
                  height: '16px',
                  width: '16px',
                  borderRadius: '4px',
                  border: '1.8px solid #b9babd'
                }}
              />
              <label htmlFor="rememberMe" style={{
                marginBottom: '0',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#3b3a2f',
                display: 'block'
              }}>
                Remember me
              </label>
            </div>

            <Link
              href="/auth/forgot-password"
              style={{
                color: '#3b3a2f',
                fontSize: '0.875rem',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.2s'
              }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className={styles.signupBtn}
            disabled={isSubmitting || isGoogleLoading || isRedirecting}
            aria-label="Sign in to account"
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner} />
                Signing In...
              </>
            ) : isRedirecting ? (
              <>
                <div className={styles.spinner} />
                Redirecting to Dashboard...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {errors.submit && (
            <div className={styles.errorMessage} style={{ textAlign: 'center', marginTop: '1rem' }}>
              {errors.submit}
            </div>
          )}

          {isRedirecting && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              color: '#155724',
              textAlign: 'center',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}>
              Sign in successful! Redirecting you to your dashboard...
            </div>
          )}
        </form>

        <div className={styles.loginLink}>
          Don&apos;t have an account? <Link href="/auth/signup">Create Account</Link>
        </div>
      </section>
    </main>
  )
}