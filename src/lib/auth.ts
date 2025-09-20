/**
 * Authentication utilities and helpers for QALA
 * Handles user authentication, registration, and session management
 */

import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { UserRegistration, Login } from './schemas/user'

export interface AuthResponse {
  success: boolean
  user?: User
  session?: Session
  error?: string
}

export interface SignUpResponse extends AuthResponse {
  emailConfirmationSent?: boolean
}

export interface OAuthResponse extends AuthResponse {
  redirected?: boolean
}

/**
 * Sign up a new user with email verification
 */
export async function signUp(userData: UserRegistration): Promise<SignUpResponse> {
  try {
    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: userData.fullName,
          native_language: userData.nativeLanguage,
          target_languages: userData.targetLanguages,
          age: userData.age,
          gender: userData.gender,
          country: userData.country,
          timezone: userData.timezone,
        },
      },
    })

    if (authError) {
      return {
        success: false,
        error: authError.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'User creation failed',
      }
    }

    // If email confirmation is required
    if (!authData.session && authData.user && !authData.user.email_confirmed_at) {
      return {
        success: true,
        user: authData.user,
        emailConfirmationSent: true,
      }
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session || undefined,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signup failed',
    }
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(credentials: Login): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign in failed',
    }
  }
}

/**
 * Sign in/up with Google OAuth
 */
export async function signInWithGoogle(): Promise<OAuthResponse> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // OAuth redirects the user, so we return success with redirected flag
    return {
      success: true,
      redirected: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Google sign in failed',
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign out failed',
    }
  }
}

/**
 * Reset user password
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Password reset failed',
    }
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      user: data.user,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Password update failed',
    }
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      // Error getting current user - return null for unauthenticated state
      return null
    }

    return user
  } catch {
    // Error getting current user - return null for unauthenticated state
    return null
  }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      // Error getting current session - return null for unauthenticated state
      return null
    }

    return session
  } catch {
    // Error getting current session - return null for unauthenticated state
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession()
  return !!session
}

/**
 * Resend email confirmation
 */
export async function resendConfirmation(email: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Confirmation resend failed',
    }
  }
}

/**
 * Auth event listener types
 */
export type AuthEventType = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY'

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: AuthEventType, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event as AuthEventType, session)
  })
}

/**
 * Create user profile after successful authentication
 * This is called via database trigger when a new auth user is created
 */
export async function createUserProfile(user: User): Promise<boolean> {
  try {
    // Extract user metadata from auth user
    const metadata = user.user_metadata || {}

    const userProfile = {
      id: user.id,
      email: user.email || '',
      full_name: metadata.full_name || '',
      native_language: metadata.native_language || 'en',
      target_languages: metadata.target_languages || ['es'],
      proficiency_levels: {},
      age: metadata.age || 16,
      gender: metadata.gender || null,
      country: metadata.country || 'USA',
      timezone: metadata.timezone || 'America/New_York',
    }

    // Use type assertion for now - types will be fixed when actual Supabase project is connected
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('users')
      .insert(userProfile)

    if (error) {
      // Error creating user profile - return false
      return false
    }

    return true
  } catch {
    // Error creating user profile - return false
    return false
  }
}