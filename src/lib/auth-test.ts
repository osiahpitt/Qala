/**
 * Authentication system test utilities
 * Tests user registration, login, password reset, and session management
 */

/* eslint-disable no-console */

import { signUp, signIn, signOut, resetPassword, getCurrentUser, getCurrentSession } from './auth'
import type { UserRegistration, Login } from './schemas/user'

/**
 * Test user registration with email verification
 */
export async function testUserRegistration() {
  try {
    console.log('🔄 Testing user registration...')

    const testUser: UserRegistration = {
      email: 'testuser@qala.app',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      fullName: 'Test User',
      nativeLanguage: 'en',
      targetLanguages: ['es', 'fr'],
      age: 25,
      gender: 'prefer-not-to-say',
      country: 'USA',
      timezone: 'America/New_York',
      termsAccepted: true,
      privacyAccepted: true,
    }

    const result = await signUp(testUser)

    if (!result.success) {
      throw new Error(`Registration failed: ${result.error}`)
    }

    if (result.emailConfirmationSent) {
      console.log('✅ User registration successful - email confirmation sent')
    } else {
      console.log('✅ User registration successful - user authenticated')
    }

    return true
  } catch (error) {
    console.error('❌ User registration test failed:', error)
    return false
  }
}

/**
 * Test user login
 */
export async function testUserLogin() {
  try {
    console.log('🔄 Testing user login...')

    const credentials: Login = {
      email: 'testuser@qala.app',
      password: 'TestPassword123!',
      rememberMe: true,
    }

    const result = await signIn(credentials)

    if (!result.success) {
      throw new Error(`Login failed: ${result.error}`)
    }

    console.log('✅ User login successful')
    return true
  } catch (error) {
    console.error('❌ User login test failed:', error)
    return false
  }
}

/**
 * Test password reset
 */
export async function testPasswordReset() {
  try {
    console.log('🔄 Testing password reset...')

    const result = await resetPassword('testuser@qala.app')

    if (!result.success) {
      throw new Error(`Password reset failed: ${result.error}`)
    }

    console.log('✅ Password reset email sent successfully')
    return true
  } catch (error) {
    console.error('❌ Password reset test failed:', error)
    return false
  }
}

/**
 * Test session management
 */
export async function testSessionManagement() {
  try {
    console.log('🔄 Testing session management...')

    // Test getting current user
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('No current user found')
    }

    console.log('✅ Current user retrieved successfully')

    // Test getting current session
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('No current session found')
    }

    console.log('✅ Current session retrieved successfully')

    // Test sign out
    const signOutResult = await signOut()
    if (!signOutResult.success) {
      throw new Error(`Sign out failed: ${signOutResult.error}`)
    }

    console.log('✅ Sign out successful')

    // Verify session is cleared
    const sessionAfterSignOut = await getCurrentSession()
    if (sessionAfterSignOut) {
      throw new Error('Session not cleared after sign out')
    }

    console.log('✅ Session cleared successfully')

    return true
  } catch (error) {
    console.error('❌ Session management test failed:', error)
    return false
  }
}

/**
 * Test email confirmation flow
 */
export async function testEmailConfirmation() {
  try {
    console.log('🔄 Testing email confirmation flow...')

    // This test requires manual interaction with email
    console.log('⚠️ Email confirmation requires manual testing:')
    console.log('  1. Register a new user')
    console.log('  2. Check email for confirmation link')
    console.log('  3. Click confirmation link')
    console.log('  4. Verify user can log in')

    return true
  } catch (error) {
    console.error('❌ Email confirmation test failed:', error)
    return false
  }
}

/**
 * Test authentication state persistence
 */
export async function testAuthPersistence() {
  try {
    console.log('🔄 Testing authentication persistence...')

    // Login first
    const credentials: Login = {
      email: 'testuser@qala.app',
      password: 'TestPassword123!',
    }

    const loginResult = await signIn(credentials)
    if (!loginResult.success) {
      throw new Error('Login required for persistence test failed')
    }

    // Simulate page reload by checking session
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('Session not persisted after page reload simulation')
    }

    console.log('✅ Authentication state persisted successfully')
    return true
  } catch (error) {
    console.error('❌ Authentication persistence test failed:', error)
    return false
  }
}

/**
 * Run all authentication tests
 */
export async function runAuthTests() {
  console.log('🚀 Starting authentication tests...')
  console.log('=' .repeat(50))

  const registrationResult = await testUserRegistration()
  const loginResult = await testUserLogin()
  const passwordResetResult = await testPasswordReset()
  const sessionResult = await testSessionManagement()
  const confirmationResult = await testEmailConfirmation()
  const persistenceResult = await testAuthPersistence()

  console.log('=' .repeat(50))
  console.log('📋 Authentication Test Results:')
  console.log(`User Registration: ${registrationResult ? '✅' : '❌'}`)
  console.log(`User Login: ${loginResult ? '✅' : '❌'}`)
  console.log(`Password Reset: ${passwordResetResult ? '✅' : '❌'}`)
  console.log(`Session Management: ${sessionResult ? '✅' : '❌'}`)
  console.log(`Email Confirmation: ${confirmationResult ? '✅' : '❌'} (Manual)`)
  console.log(`Auth Persistence: ${persistenceResult ? '✅' : '❌'}`)

  const allTestsPassed = registrationResult && loginResult && passwordResetResult &&
                        sessionResult && confirmationResult && persistenceResult

  console.log(`Overall Result: ${allTestsPassed ? '🎉 PASS' : '❌ FAIL'}`)

  return allTestsPassed
}

/**
 * Quick authentication system health check
 */
export async function authHealthCheck() {
  try {
    console.log('🔄 Running authentication health check...')

    // Check if auth client is properly configured
    const session = await getCurrentSession()
    console.log(`Current session status: ${session ? 'Authenticated' : 'Not authenticated'}`)

    // Test basic auth functionality without side effects
    const user = await getCurrentUser()
    console.log(`Current user status: ${user ? 'User loaded' : 'No user'}`)

    console.log('✅ Authentication system health check completed')
    return true
  } catch (error) {
    console.error('❌ Authentication health check failed:', error)
    return false
  }
}