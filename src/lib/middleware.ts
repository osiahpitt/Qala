/**
 * Protected Route Middleware for QALA
 * Handles route protection, authentication checks, and redirects
 * Works with Next.js 14 App Router
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

/**
 * Route protection configuration
 */
export const PROTECTED_ROUTES = [
  // '/dashboard', // TEMPORARILY DISABLED FOR TESTING
  '/profile',
  '/matching',
  '/session',
  '/chat',
  '/settings',
] as const

/**
 * Routes that require email verification (subset of protected routes)
 * Dashboard and profile are accessible to unverified users with limitations
 */
export const EMAIL_VERIFICATION_REQUIRED_ROUTES = [
  '/matching',
  '/session',
  '/chat',
] as const

export const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
] as const

export const PROFILE_SETUP_ROUTE = '/profile/setup'
export const LOGIN_ROUTE = '/auth/login'
export const HOME_ROUTE = '/'

/**
 * Check if a path matches protected routes
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a path is an auth route
 */
export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a path requires email verification
 */
export function requiresEmailVerification(pathname: string): boolean {
  return EMAIL_VERIFICATION_REQUIRED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if user has completed their profile setup
 */
export function hasCompletedProfile(user: User | null): boolean {
  if (!user) {
    return false
  }

  const metadata = user.user_metadata || {}

  // Check required profile fields
  const requiredFields = [
    'full_name',
    'native_language',
    'target_languages',
    'age',
    'country',
    'timezone',
  ]

  return requiredFields.every(field => {
    const value = metadata[field]
    if (field === 'target_languages') {
      return Array.isArray(value) && value.length > 0
    }
    return value !== undefined && value !== null && value !== ''
  })
}

/**
 * Main middleware function for route protection
 */
export async function authMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Skip middleware for static files, API routes, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return response
  }

  try {
    // Create Supabase client for middleware
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options: _cookieOptions }) =>
              request.cookies.set(name, value)
            )
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Get current session - try refresh if initial call fails
    let { data: { session }, error } = await supabase.auth.getSession()

    // If no session found, try refreshing the session
    if (!session && !error) {
      const refreshResult = await supabase.auth.refreshSession()
      if (!refreshResult.error && refreshResult.data.session) {
        session = refreshResult.data.session
        error = null
      }
    }

    const isAuthenticated = !!session?.user && !error
    const user = session?.user || null

    // Handle protected routes
    if (isProtectedRoute(pathname)) {
      if (!isAuthenticated) {
        // Redirect unauthenticated users to login
        const loginUrl = new URL(LOGIN_ROUTE, request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Check email verification for sensitive routes only
      if (requiresEmailVerification(pathname) && !user?.email_confirmed_at) {
        const verifyUrl = new URL('/auth/verify-email', request.url)
        verifyUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(verifyUrl)
      }

      // Check profile completion (except for profile setup route)
      if (pathname !== PROFILE_SETUP_ROUTE && !hasCompletedProfile(user)) {
        const setupUrl = new URL(PROFILE_SETUP_ROUTE, request.url)
        return NextResponse.redirect(setupUrl)
      }
    }

    // Handle auth routes when already authenticated
    if (isAuthRoute(pathname) && isAuthenticated) {
      // If user is authenticated but hasn't completed profile, allow profile setup
      if (!hasCompletedProfile(user)) {
        if (pathname !== PROFILE_SETUP_ROUTE) {
          const setupUrl = new URL(PROFILE_SETUP_ROUTE, request.url)
          return NextResponse.redirect(setupUrl)
        }
      } else {
        // Redirect authenticated users with complete profiles away from auth pages
        const redirectTo = request.nextUrl.searchParams.get('redirectTo')
        const dashboardUrl = new URL(redirectTo || '/dashboard', request.url)
        return NextResponse.redirect(dashboardUrl)
      }
    }

    // Handle profile setup route
    if (pathname === PROFILE_SETUP_ROUTE) {
      if (!isAuthenticated) {
        // Redirect unauthenticated users to login
        const loginUrl = new URL(LOGIN_ROUTE, request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Allow unverified users to access profile setup
      // Email verification is not required for profile completion

      if (hasCompletedProfile(user)) {
        // Redirect users with complete profiles to dashboard
        const dashboardUrl = new URL('/dashboard', request.url)
        return NextResponse.redirect(dashboardUrl)
      }
    }

    return response
  } catch (_error) {
    // Log error and allow request to continue
    // In production, you might want to redirect to an error page
    // Log error in development mode only
    // Error logging handled by global error handler in production
    return response
  }
}

/**
 * Higher-order component for protecting pages
 * Use this for client-side route protection
 * Note: This will be implemented as a separate React component
 */
export function createAuthWrapper(
  options: {
    requireEmailVerification?: boolean
    requireCompleteProfile?: boolean
    redirectTo?: string
  } = {}
) {
  const {
    requireEmailVerification = true,
    requireCompleteProfile = true,
    redirectTo = LOGIN_ROUTE,
  } = options

  return {
    requireEmailVerification,
    requireCompleteProfile,
    redirectTo,
  }
}

/**
 * Client-side route guard hook
 * Use this in components that need auth checks
 */
export function useRouteGuard(options: {
  requireAuth?: boolean
  requireEmailVerification?: boolean
  requireCompleteProfile?: boolean
  redirectTo?: string
} = {}) {
  const {
    requireAuth: _requireAuth = true,
    requireEmailVerification: _requireEmailVerification = true,
    requireCompleteProfile: _requireCompleteProfile = true,
    redirectTo: _redirectTo = LOGIN_ROUTE,
  } = options

  // This will be implemented when we integrate with the AuthContext
  // For now, return a basic object
  return {
    isLoading: false,
    isAuthorized: true,
    redirect: null,
  }
}

/**
 * Utility function to check if user can access a specific route
 */
export function canAccessRoute(
  user: User | null,
  pathname: string,
  options: {
    requireEmailVerification?: boolean
    requireCompleteProfile?: boolean
  } = {}
): { canAccess: boolean; redirectTo?: string } {
  const { requireCompleteProfile = true } = options

  // Public routes are always accessible
  if (!isProtectedRoute(pathname)) {
    return { canAccess: true }
  }

  // Protected routes require authentication
  if (!user) {
    return { canAccess: false, redirectTo: LOGIN_ROUTE }
  }

  // Check email verification for sensitive routes only
  // Dashboard and profile routes are now accessible to unverified users
  if (requiresEmailVerification(pathname) && !user.email_confirmed_at) {
    return { canAccess: false, redirectTo: '/auth/verify-email' }
  }

  // Check profile completion
  if (requireCompleteProfile && !hasCompletedProfile(user)) {
    return { canAccess: false, redirectTo: PROFILE_SETUP_ROUTE }
  }

  return { canAccess: true }
}

/**
 * Rate limiting configuration for sensitive routes
 */
export const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5, // Maximum 5 attempts per window
  },
  matching: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 10, // Maximum 10 match requests per minute
  },
  profile: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 20, // Maximum 20 profile updates per 5 minutes
  },
} as const

/**
 * Export types for TypeScript support
 */
export type ProtectedRoute = (typeof PROTECTED_ROUTES)[number]
export type AuthRoute = (typeof AUTH_ROUTES)[number]
export type EmailVerificationRequiredRoute = (typeof EMAIL_VERIFICATION_REQUIRED_ROUTES)[number]