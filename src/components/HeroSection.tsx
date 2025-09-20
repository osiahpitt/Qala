import { useState } from 'react'
import Image from 'next/image'
import { validateEmail } from '@/lib/schemas/email'
import { Header } from '@/components/Header'

interface HeroSectionProps {
  backgroundImage?: string
  headline: string
  subheadline: string
  pricing: string
  ctaText: string
  onEmailSubmit: (email: string) => void
}

export function HeroSection({
  backgroundImage,
  headline,
  subheadline,
  pricing,
  ctaText: _ctaText,
  onEmailSubmit,
}: HeroSectionProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validate email
    const validation = validateEmail(email)
    if (!validation.success) {
      setError(validation.error || 'Please enter a valid email')
      return
    }

    setIsSubmitting(true)
    try {
      // Use normalized email for submission
      const normalizedEmail = validation.normalizedEmail
      if (normalizedEmail) {
        await onEmailSubmit(normalizedEmail)
        setEmail('')
      }
      setSuccess(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="netflix-hero">
      {/* Background Layer */}
      {backgroundImage ? (
        <div className="netflix-hero-background">
          <Image
            src={backgroundImage}
            alt="QALA Hero Background"
            fill
            className="object-cover"
            priority
            quality={85}
            sizes="100vw"
            onError={() => {
              // Fallback to CSS gradient if image fails to load
              const element = document.querySelector('.netflix-hero-background') as HTMLElement
              if (element) {
                element.style.background = 'linear-gradient(135deg, #2c1810 0%, #1a0f0a 50%, #0f0806 100%)'
                element.style.backgroundSize = 'cover'
              }
            }}
          />
        </div>
      ) : (
        // Fallback gradient background inspired by cave/earth theme
        <div
          className="netflix-hero-background"
          style={{
            background: 'linear-gradient(135deg, #2c1810 0%, #1a0f0a 50%, #0f0806 100%)',
            backgroundSize: 'cover'
          }}
        />
      )}

      {/* Overlay for text readability */}
      <div className="netflix-overlay" />

      {/* Header */}
      <Header variant="landing" />

      {/* Content Layer */}
      <div className="netflix-content shifted">
        {/* Main Headline - Netflix style */}
        <h1 className="netflix-main-header">
          {headline}
        </h1>

        {/* Pricing Information */}
        <p className="netflix-subscription-info">
          {pricing}
        </p>

        {/* Subheadline */}
        <h2 className="netflix-subheader">
          {subheadline}
        </h2>

        {/* Email Capture Form */}
        <form onSubmit={handleSubmit}>
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 rounded-lg bg-green-600/20 border border-green-600/30 text-green-200 text-center max-w-md mx-auto">
              ✓ Thanks! Redirecting you to create your account...
            </div>
          )}

          <div className="netflix-email-form">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) {
                  setError(null) // Clear error on typing
                }
              }}
              placeholder="Email Address"
              className={`netflix-transparent-input ${
                error ? 'border-red-500' : ''
              }`}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'email-error' : undefined}
              required
            />
            <button
              type="submit"
              className="netflix-get-started-btn"
              disabled={!email.trim() || isSubmitting}
            >
              {isSubmitting ? 'Please wait...' : 'Get Started'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              id="email-error"
              className="mt-3 text-red-400 text-sm text-center"
              role="alert"
            >
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}