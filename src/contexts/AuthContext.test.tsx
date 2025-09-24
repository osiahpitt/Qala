import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { AuthProvider, useAuth } from './AuthContext'
import * as authModule from '@/lib/auth'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  getCurrentUser: vi.fn(),
  getCurrentSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  resendConfirmation: vi.fn(),
}))

// Mock Supabase types
const mockUser: User = {
  id: 'test-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  phone: undefined,
  confirmed_at: '2024-01-01T00:00:00.000Z',
  last_sign_in_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {
    full_name: 'Test User',
    native_language: 'en',
    target_languages: ['es', 'fr'],
    age: 25,
    gender: 'male',
    country: 'USA',
    timezone: 'America/New_York',
  },
  identities: [],
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  is_anonymous: false,
}

const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockUser,
}

// Mock user profile placeholder for future tests

// Test component that uses useAuth
function TestComponent() {
  const auth = useAuth()

  return (
    <div>
      <div data-testid="user-id">{auth.user?.id || 'no-user'}</div>
      <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="is-loading">{auth.isLoading.toString()}</div>
      <div data-testid="is-email-verified">{auth.isEmailVerified.toString()}</div>
      <div data-testid="has-completed-profile">{auth.hasCompletedProfile.toString()}</div>
      <div data-testid="error">{auth.error || 'no-error'}</div>
      <button onClick={() => auth.signOut()} data-testid="sign-out-btn">
        Sign Out
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  const mockAuthStateChangeCallback = vi.fn()
  const mockUnsubscribe = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock auth state change subscription
    vi.mocked(authModule.onAuthStateChange).mockImplementation((callback) => {
      mockAuthStateChangeCallback.mockImplementation(callback)
      return {
        data: {
          subscription: {
            id: 'mock-subscription-id',
            callback: callback as (event: AuthChangeEvent, session: Session | null) => void,
            unsubscribe: mockUnsubscribe,
          },
        },
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('AuthProvider', () => {
    it('should provide initial auth state when not authenticated', async () => {
      // Mock no current user/session
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(null)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue(null)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Initially loading should be true
      expect(screen.getByTestId('is-loading')).toHaveTextContent('true')

      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('user-id')).toHaveTextContent('no-user')
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('is-email-verified')).toHaveTextContent('false')
      expect(screen.getByTestId('has-completed-profile')).toHaveTextContent('false')
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
    })

    it('should provide auth state when authenticated', async () => {
      // Mock authenticated user/session
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue(mockSession)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('user-id')).toHaveTextContent('test-user-id')
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('is-email-verified')).toHaveTextContent('true')
      expect(screen.getByTestId('has-completed-profile')).toHaveTextContent('true')
    })

    it('should handle auth state changes', async () => {
      // Start with no auth
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(null)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue(null)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')

      // Simulate sign in event
      act(() => {
        mockAuthStateChangeCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      })

      expect(screen.getByTestId('user-id')).toHaveTextContent('test-user-id')
    })

    it('should handle sign out', async () => {
      // Start authenticated
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue(mockSession)
      vi.mocked(authModule.signOut).mockResolvedValue({ success: true })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      })

      // Simulate sign out
      act(() => {
        mockAuthStateChangeCallback('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('user-id')).toHaveTextContent('no-user')
    })

    it('should handle initialization errors gracefully', async () => {
      // Mock error during initialization
      vi.mocked(authModule.getCurrentUser).mockRejectedValue(new Error('Auth error'))
      vi.mocked(authModule.getCurrentSession).mockRejectedValue(new Error('Auth error'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('error')).toHaveTextContent('Auth error')
    })

    it('should unsubscribe from auth changes on unmount', async () => {
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(null)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue(null)

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      })

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })

    it('should provide auth methods', async () => {
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Check that all auth methods are available
      expect(typeof result.current.signUp).toBe('function')
      expect(typeof result.current.signIn).toBe('function')
      expect(typeof result.current.signOut).toBe('function')
      expect(typeof result.current.resetPassword).toBe('function')
      expect(typeof result.current.updatePassword).toBe('function')
      expect(typeof result.current.resendConfirmation).toBe('function')
      expect(typeof result.current.refreshProfile).toBe('function')
      expect(typeof result.current.updateProfile).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })

    it('should handle sign up', async () => {
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(null)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue(null)
      vi.mocked(authModule.signUp).mockResolvedValue({
        success: true,
        user: mockUser,
        session: mockSession,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const mockUserData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Test User',
        nativeLanguage: 'en' as const,
        targetLanguages: ['es' as const],
        age: 25,
        gender: 'male' as const,
        country: 'USA',
        timezone: 'America/New_York',
        termsAccepted: true,
        privacyAccepted: true,
      }

      const response = await result.current.signUp(mockUserData)

      expect(authModule.signUp).toHaveBeenCalledWith(mockUserData)
      expect(response.success).toBe(true)
    })

    it('should handle sign in', async () => {
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(null)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue(null)
      vi.mocked(authModule.signIn).mockResolvedValue({
        success: true,
        user: mockUser,
        session: mockSession,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      const response = await result.current.signIn(credentials)

      expect(authModule.signIn).toHaveBeenCalledWith(credentials)
      expect(response.success).toBe(true)
    })

    it('should handle authentication errors', async () => {
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(null)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue(null)
      vi.mocked(authModule.signIn).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      await act(async () => {
        const response = await result.current.signIn(credentials)
        expect(response.success).toBe(false)
        expect(response.error).toBe('Invalid credentials')
      })

      expect(result.current.error).toBe('Invalid credentials')
    })

    it('should clear errors', async () => {
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(null)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue(null)
      vi.mocked(authModule.signIn).mockResolvedValue({
        success: false,
        error: 'Test error',
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Trigger an error
      await act(async () => {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      })

      expect(result.current.error).toBe('Test error')

      // Clear the error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })

    it('should handle profile refresh', async () => {
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasCompletedProfile).toBe(true)

      // Refresh profile should not throw
      await expect(result.current.refreshProfile()).resolves.toBeUndefined()
    })

    it('should handle profile updates', async () => {
      vi.mocked(authModule.getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Wait for initial profile to load
      await waitFor(() => {
        expect(result.current.profile).toBeTruthy()
      })

      const updates = { fullName: 'Updated Name' }

      await act(async () => {
        const success = await result.current.updateProfile(updates)
        expect(success).toBe(true)
      })

      expect(result.current.profile?.fullName).toBe('Updated Name')
    })
  })

  describe('Auth state derived properties', () => {
    it('should correctly calculate isEmailVerified', async () => {
      const userWithoutConfirmedEmail = {
        ...mockUser,
        email_confirmed_at: undefined,
      }

      vi.mocked(authModule.getCurrentUser).mockResolvedValue(userWithoutConfirmedEmail)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue({
        ...mockSession,
        user: userWithoutConfirmedEmail,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isEmailVerified).toBe(false)
    })

    it('should correctly calculate hasCompletedProfile', async () => {
      const userWithoutFullName = {
        ...mockUser,
        user_metadata: {
          ...mockUser.user_metadata,
          full_name: '',
        },
      }

      vi.mocked(authModule.getCurrentUser).mockResolvedValue(userWithoutFullName)
      vi.mocked(authModule.getCurrentSession).mockResolvedValue({
        ...mockSession,
        user: userWithoutFullName,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasCompletedProfile).toBe(false)
    })
  })
})