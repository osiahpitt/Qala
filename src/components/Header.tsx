'use client'

import Link from 'next/link'

interface HeaderProps {
  variant?: 'landing' | 'app'
  className?: string
}

export function Header({ variant = 'landing', className = '' }: HeaderProps) {
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
          <Link
            href="/auth/login"
            className="netflix-signin-btn"
          >
            Sign In
          </Link>
        )}
      </nav>
    </header>
  )
}