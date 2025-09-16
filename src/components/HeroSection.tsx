import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { validateEmail } from '@/lib/schemas/email'

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
  ctaText,
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
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {backgroundImage ? (
          <Image
            src={backgroundImage}
            alt="QALA Hero Background"
            fill
            className="object-cover"
            priority
            quality={85}
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary via-secondary to-accent" />
        )}
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        {/* Main Headline - Netflix/Acquisition.com inspired */}
        <h1 className="hero-headline text-white mb-6 font-bold leading-none tracking-tight">
          {headline}
        </h1>

        {/* Pricing Information */}
        <p className="hero-subheadline text-white/90 mb-4 font-medium">
          {pricing}
        </p>

        {/* Subheadline */}
        <p className="hero-description text-white/80 mb-12 max-w-2xl mx-auto text-lg">
          {subheadline}
        </p>

        {/* Email Capture Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 rounded-lg bg-green-600/20 border border-green-600/30 text-green-200 text-center">
              ✓ Thanks! We&apos;ll contact you soon for your 7-day free trial.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) {
                  setError(null) // Clear error on typing
                }
              }}
              placeholder="Enter your email for 7 day free trial"
              className={`flex-1 px-6 py-4 rounded-lg border-0 text-foreground text-lg placeholder:text-foreground-muted focus:outline-none focus:ring-2 ${
                error ? 'focus:ring-red-500 ring-1 ring-red-500' : 'focus:ring-primary'
              }`}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'email-error' : undefined}
              required
            />
            <Button
              type="submit"
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 text-lg whitespace-nowrap rounded-lg transition-colors"
              loading={isSubmitting}
              disabled={!email.trim() || isSubmitting}
            >
              {ctaText}
            </Button>
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
    </section>
  )
}