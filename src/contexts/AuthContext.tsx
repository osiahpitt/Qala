'use client'

/**
 * AuthContext - Authentication state management for QALA
 * Provides authentication state and methods throughout the application
 * Integrates with Supabase auth and handles auth state persistence
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import {
  signUp,
  signIn,
  signOut,
  signInWithGoogle,
  resetPassword,
  updatePassword,
  getCurrentUser,
  getCurrentSession,
  onAuthStateChange,
  resendConfirmation,
  type AuthResponse,
  type SignUpResponse,
  type OAuthResponse,
} from '@/lib/auth'
import type { UserRegistration, Login } from '@/lib/schemas/user'

/**
 * User profile interface - extended user data from database
 */
export interface UserProfile {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  nativeLanguage: string
  targetLanguages: string[]
  proficiencyLevels: Record<string, string>
  age: number
  gender?: string
  country: string
  timezone: string
  subscriptionTier: string
  translationQuotaUsed: number
  quotaResetDate: string
  isBanned: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Authentication state interface
 */
export interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  isEmailVerified: boolean
  hasCompletedProfile: boolean
}

/**
 * Authentication context interface
 */
export interface AuthContextType extends AuthState {
  // Authentication methods
  signUp: (userData: UserRegistration) => Promise<SignUpResponse>
  signIn: (credentials: Login) => Promise<AuthResponse>
  signInWithGoogle: () => Promise<OAuthResponse>
  signOut: () => Promise<AuthResponse>
  resetPassword: (email: string) => Promise<AuthResponse>
  updatePassword: (newPassword: string) => Promise<AuthResponse>
  resendConfirmation: (email: string) => Promise<AuthResponse>

  // Profile methods
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>

  // State management
  clearError: () => void
  error: string | null

  // Aliases for backward compatibility
  userProfile: UserProfile | null
  loading: boolean
}

/**
 * Create auth context with undefined default
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider component props
 */
interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider - Manages authentication state and provides auth methods
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Authentication state
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Derived state
  const isAuthenticated = !!user && !!session
  const isEmailVerified = !!user?.email_confirmed_at

  // Standardized profile completion logic to match middleware
  const hasCompletedProfile = useMemo(() => {
    if (!user) return false;

    const metadata = user.user_metadata || {};
    const requiredFields = [
      'full_name',
      'native_language',
      'target_languages',
      'age',
      'country',
      'timezone'
    ];

    return requiredFields.every(field => {
      const value = metadata[field];
      if (field === 'target_languages') {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
  }, [user]);

  /**
   * Fetch user profile from database
   */
  const fetchUserProfile = useCallback(async (userId: string): Promise<void> => {
    try {
      // Get the current user data to construct the profile
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        throw new Error('User not found')
      }

      // This will be implemented when we have the actual Supabase project connected
      // For now, we'll use a mock implementation
      const mockProfile: UserProfile = {
        id: userId,
        email: currentUser.email || '',
        fullName: currentUser.user_metadata?.full_name || '',
        avatarUrl: currentUser.user_metadata?.avatar_url,
        nativeLanguage: currentUser.user_metadata?.native_language || 'en',
        targetLanguages: currentUser.user_metadata?.target_languages || ['es'],
        proficiencyLevels: currentUser.user_metadata?.proficiency_levels || {},
        age: currentUser.user_metadata?.age || 16,
        gender: currentUser.user_metadata?.gender,
        country: currentUser.user_metadata?.country || 'USA',
        timezone: currentUser.user_metadata?.timezone || 'America/New_York',
        subscriptionTier: 'free',
        translationQuotaUsed: 0,
        quotaResetDate: new Date().toISOString(),
        isBanned: false,
        createdAt: currentUser.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setProfile(mockProfile)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch user profile')
    }
  }, [])

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get current session and user
        const [currentUser, currentSession] = await Promise.all([
          getCurrentUser(),
          getCurrentSession(),
        ])

        if (!mounted) {
          return
        }

        setUser(currentUser)
        setSession(currentSession)

        // If user exists, fetch their profile
        if (currentUser) {
          try {
            await fetchUserProfile(currentUser.id)
          } catch (profileError) {
            // Don't fail initialization if profile fetch fails
            // Failed to fetch user profile during initialization
          }
        }
      } catch (error) {
        if (mounted) {
          // Clear user state on initialization error
          setUser(null)
          setSession(null)
          setProfile(null)
          setError(error instanceof Error ? error.message : 'Failed to initialize auth')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [fetchUserProfile])

  /**
   * Subscribe to auth state changes
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      setSession(session)
      setUser(session?.user ?? null)

      // Handle auth events
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            try {
              await fetchUserProfile(session.user.id)
            } catch (error) {
              // Silently handle profile fetch errors to avoid breaking auth flow
              // Failed to fetch user profile
            }
          }
          setError(null)
          break

        case 'SIGNED_OUT':
          setProfile(null)
          setError(null)
          break

        case 'TOKEN_REFRESHED':
          if (session?.user) {
            try {
              await fetchUserProfile(session.user.id)
            } catch (error) {
              // Failed to fetch user profile on token refresh
            }
          }
          break

        case 'USER_UPDATED':
          if (session?.user) {
            try {
              await fetchUserProfile(session.user.id)
            } catch (error) {
              // Failed to fetch user profile on user update
            }
          }
          break

        default:
          break
      }

      // Don't manage loading state here - let the initialization handle it
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

  /**
   * Sign up a new user
   */
  const handleSignUp = async (userData: UserRegistration): Promise<SignUpResponse> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await signUp(userData)

      if (!result.success) {
        setError(result.error || 'Signup failed')
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Sign in existing user
   */
  const handleSignIn = async (credentials: Login): Promise<AuthResponse> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await signIn(credentials)

      if (!result.success) {
        const errorMessage = result.error || 'Sign in failed'
        setError(errorMessage)
        return {
          success: false,
          error: errorMessage,
        }
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Sign in/up with Google OAuth
   */
  const handleSignInWithGoogle = async (): Promise<OAuthResponse> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await signInWithGoogle()

      if (!result.success) {
        const errorMessage = result.error || 'Google sign in failed'
        setError(errorMessage)
        return {
          success: false,
          error: errorMessage,
        }
      }

      // OAuth redirects the user, so we don't need to handle success here
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Sign out current user
   */
  const handleSignOut = async (): Promise<AuthResponse> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await signOut()

      if (!result.success) {
        setError(result.error || 'Sign out failed')
      } else {
        // Clear local state
        setUser(null)
        setProfile(null)
        setSession(null)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Reset user password
   */
  const handleResetPassword = async (email: string): Promise<AuthResponse> => {
    try {
      setError(null)

      const result = await resetPassword(email)

      if (!result.success) {
        setError(result.error || 'Password reset failed')
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Update user password
   */
  const handleUpdatePassword = async (newPassword: string): Promise<AuthResponse> => {
    try {
      setError(null)

      const result = await updatePassword(newPassword)

      if (!result.success) {
        setError(result.error || 'Password update failed')
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Resend email confirmation
   */
  const handleResendConfirmation = async (email: string): Promise<AuthResponse> => {
    try {
      setError(null)

      const result = await resendConfirmation(email)

      if (!result.success) {
        setError(result.error || 'Confirmation resend failed')
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Confirmation resend failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Refresh user profile
   */
  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  /**
   * Update user profile
   */
  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      if (!user || !profile) {
        throw new Error('User not authenticated')
      }

      // This will be implemented when we have the actual Supabase project connected
      // For now, we'll update the local state
      setProfile(prev => prev ? { ...prev, ...updates } : null)

      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Profile update failed')
      return false
    }
  }

  /**
   * Clear error state
   */
  const clearError = (): void => {
    setError(null)
  }

  // Context value
  const value: AuthContextType = {
    // State
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    isEmailVerified,
    hasCompletedProfile,
    error,

    // Methods
    signUp: handleSignUp,
    signIn: handleSignIn,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
    resendConfirmation: handleResendConfirmation,
    refreshProfile,
    updateProfile,
    clearError,

    // Aliases for backward compatibility
    userProfile: profile,
    loading: isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth hook - Access authentication context
 * Throws error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

