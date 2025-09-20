'use client'

import { useRouter } from 'next/navigation'
import { HeroSection } from '@/components/HeroSection'
import { validateEmail } from '@/lib/schemas/email'
import { AUTH_DELAYS } from '@/lib/constants'

export default function Home() {
  const router = useRouter()

  const handleEmailSubmit = async (email: string) => {
    // Validate email first
    const validation = validateEmail(email)
    if (!validation.success) {
      throw new Error(validation.error || 'Please enter a valid email')
    }

    // Simulate brief loading for UX
    await new Promise(resolve => setTimeout(resolve, AUTH_DELAYS.LOADING_SIMULATION_DELAY))

    // Redirect to signup page with email pre-filled
    const searchParams = new URLSearchParams({ email: validation.normalizedEmail || email })
    router.push(`/auth/signup?${searchParams.toString()}`)
  }

  return (
    <main className="min-h-screen">
      <HeroSection
        headline="Become Fluent With Natives Through Instant Video Chat"
        pricing="Free with ads, or ad free for $7.99/month. Cancel anytime."
        subheadline="Ready to match? Enter your email to get started."
        ctaText="Get Started"
        onEmailSubmit={handleEmailSubmit}
      />
    </main>
  )
}
