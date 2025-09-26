/**
 * Authentication utilities and helpers for QALA
 * Handles user authentication, registration, and session management
 */

import { supabase } from './supabase'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import type { UserRegistration, Login } from './schemas/user'

const MINIMUM_USER_AGE = 18

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
    // Create the auth user with OTP verification (no redirect URLs)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        // Explicitly disable email confirmation redirect
        emailRedirectTo: undefined,
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
 * Verify email with OTP code
 */
export async function verifyEmail(email: string, token: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Email verification failed',
      }
    }

    // Create user profile after email verification
    await createUserProfile(data.user)

    return {
      success: true,
      user: data.user,
      session: data.session || undefined,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email verification failed',
    }
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(credentials: Login): Promise<AuthResponse> {
  try {
    // Remove mock auth to prevent interference with real authentication

    // Use direct fetch instead of SDK to bypass hanging issue
    let data, error;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      // Direct fetch auth call completed

      if (response.ok) {
        const authData = await response.json();
        data = {
          user: authData.user,
          session: authData
        };
        error = null;

        // Set the session in Supabase client to trigger auth state changes
        if (authData.access_token && authData.refresh_token) {
          await supabase.auth.setSession({
            access_token: authData.access_token,
            refresh_token: authData.refresh_token
          });
        }
      } else {
        const errorData = await response.json();
        data = null;
        error = { message: errorData.msg || errorData.error_description || 'Authentication failed' };
      }
    } catch (fetchError) {
      data = null;
      error = { message: fetchError instanceof Error ? fetchError.message : 'Network error' };
    }

    // Supabase signIn completed

    if (error) {

      // Provide more user-friendly error messages
      let userFriendlyError = error.message

      if (error.message.includes('Invalid login credentials')) {
        userFriendlyError = 'Invalid email or password. Please check your credentials and try again.'
      } else if (error.message.includes('Email not confirmed')) {
        userFriendlyError = 'Please check your email and click the verification link before signing in.'
      } else if (error.message.includes('Too many requests')) {
        userFriendlyError = 'Too many sign-in attempts. Please wait a moment and try again.'
      }

      return {
        success: false,
        error: userFriendlyError,
      }
    }

    // SignIn successful
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
        // Remove redirect to use OTP-based verification
        emailRedirectTo: undefined,
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
 * Check if user exists by email (returns user status)
 */
export interface UserExistenceResult {
  exists: boolean
  isEmailVerified?: boolean
  needsPasswordReset?: boolean
  error?: string
}

export async function checkUserExists(email: string): Promise<UserExistenceResult> {
  try {
    // Try to sign in with a temporary password to check if user exists
    // This will fail but we can analyze the error to determine if user exists
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'temp-password-to-check-existence-' + Math.random(),
    })

    if (error) {
      // User exists if we get "Invalid login credentials" (wrong password)
      // User doesn't exist if we get "Email not confirmed" or similar
      if (error.message.includes('Invalid login credentials')) {
        return {
          exists: true,
          isEmailVerified: true,
        }
      }

      if (error.message.includes('Email not confirmed')) {
        return {
          exists: true,
          isEmailVerified: false,
        }
      }

      // For any other error, assume user doesn't exist
      return {
        exists: false,
      }
    }

    // If no error (very unlikely with random password), user exists and is verified
    return {
      exists: true,
      isEmailVerified: true,
    }
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unable to check user existence',
    }
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
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
      age: metadata.age || MINIMUM_USER_AGE,
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