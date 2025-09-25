'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCallback } from 'react'

interface HeaderProps {
  variant?: 'landing' | 'app'
  className?: string
}

export function Header({ variant = 'landing', className = '' }: HeaderProps) {
  const { isAuthenticated, isLoading, hasCompletedProfile } = useAuth()
  const router = useRouter()

  const handleSignInClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (isAuthenticated) {
      // User is signed in, redirect to dashboard
      router.push('/dashboard')
    } else {
      // User is not signed in, redirect to login
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  return (
    <header className={`relative z-10 flex justify-between items-center p-5 md:px-12 ${className}`}>
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <h1 className="text-2xl md:text-3xl font-bold transition-colors duration-200" style={{ color: 'var(--qala-gold)' }}>
          Qala
        </h1>
      </Link>

      {/* Navigation */}
      <nav className="flex items-center gap-4">
        {variant === 'landing' && (
          <button
            onClick={handleSignInClick}
            disabled={isLoading}
            className="netflix-signin-btn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </span>
            ) : isAuthenticated ? (
              'Go to Dashboard'
            ) : (
              'Sign In'
            )}
          </button>
        )}
      </nav>
    </header>
  )
}