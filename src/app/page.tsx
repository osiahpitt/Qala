'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { HeroSection } from '@/components/HeroSection'
import { validateEmail } from '@/lib/schemas/email'
import { checkUserExists } from '@/lib/auth'
import { AUTH_DELAYS } from '@/lib/constants'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const handleEmailSubmit = async (email: string) => {
    // Validate email first
    const validation = validateEmail(email)
    if (!validation.success) {
      throw new Error(validation.error || 'Please enter a valid email')
    }

    const normalizedEmail = validation.normalizedEmail || email

    // Check if user is already authenticated
    if (isAuthenticated) {
      // Redirect to dashboard for authenticated users
      router.push('/dashboard')
      return
    }

    // Simulate brief loading for UX
    await new Promise(resolve => setTimeout(resolve, AUTH_DELAYS.LOADING_SIMULATION_DELAY))

    // Check if user already exists
    try {
      const userStatus = await checkUserExists(normalizedEmail)

      if (userStatus.exists) {
        if (userStatus.isEmailVerified) {
          // User exists and is verified - redirect to sign-in
          const searchParams = new URLSearchParams({
            email: normalizedEmail,
            message: 'You already have an account. Please sign in.'
          })
          router.push(`/auth/login?${searchParams.toString()}`)
        } else {
          // User exists but email not verified - redirect to verification
          const searchParams = new URLSearchParams({
            email: normalizedEmail,
            message: 'Please check your email and verify your account.'
          })
          router.push(`/auth/verify-email?${searchParams.toString()}`)
        }
      } else {
        // User doesn't exist - continue with signup
        const searchParams = new URLSearchParams({ email: normalizedEmail })
        router.push(`/auth/signup?${searchParams.toString()}`)
      }
    } catch (_error) {
      // If we can't check user existence, fall back to signup flow
      const searchParams = new URLSearchParams({ email: normalizedEmail })
      router.push(`/auth/signup?${searchParams.toString()}`)
    }
  }

  return (
    <main className="min-h-screen">
      <HeroSection
        backgroundImage="/QalaCave-nosmoke.jpg"
        headline="Become Fluent With Natives Through Instant Video Chat"
        pricing="Free with ads, or ad free for $7.99/month. Cancel anytime."
        subheadline="Ready to match? Enter your email to get started."
        onEmailSubmit={handleEmailSubmit}
      />
    </main>
  )
}
