/**
 * Header Component Tests
 * Tests the smart routing logic for the sign-in button
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useRouter } from 'next/navigation'
import { Header } from './Header'
import { useAuth } from '@/contexts/AuthContext'
import type { AuthContextType } from '@/contexts/AuthContext'

// Mock the auth module to prevent Supabase initialization
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
  signInWithGoogle: vi.fn(),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockPush = vi.fn()
const mockUseRouter = useRouter as vi.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>

// Mock auth context type with all required properties
const createMockAuthContext = (overrides: Partial<AuthContextType>): AuthContextType => ({
  user: null,
  profile: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  isEmailVerified: false,
  hasCompletedProfile: false,
  error: null,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  resendConfirmation: vi.fn(),
  refreshProfile: vi.fn(),
  updateProfile: vi.fn(),
  clearError: vi.fn(),
  userProfile: null,
  loading: false,
  ...overrides,
})

describe('Header Component', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    })
    mockPush.mockClear()
  })

  describe('Sign-in button routing', () => {
    it('should redirect to login when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue(createMockAuthContext({
        isAuthenticated: false,
        isLoading: false,
      }))

      render(<Header variant="landing" />)

      const signInButton = screen.getByText('Sign In')
      expect(signInButton).toBeInTheDocument()

      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should redirect to dashboard when user is authenticated', async () => {
      mockUseAuth.mockReturnValue(createMockAuthContext({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'user-123' } as any,
      }))

      render(<Header variant="landing" />)

      const dashboardButton = screen.getByText('Go to Dashboard')
      expect(dashboardButton).toBeInTheDocument()

      fireEvent.click(dashboardButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should show loading state when authentication is loading', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext({
        isLoading: true,
        isAuthenticated: false,
      }))

      render(<Header variant="landing" />)

      const loadingText = screen.getByText('Loading...')
      expect(loadingText).toBeInTheDocument()

      // Check that the button (parent element) is disabled
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should not render sign-in button for app variant', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext({
        isAuthenticated: false,
        isLoading: false,
      }))

      render(<Header variant="app" />)

      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
      expect(screen.queryByText('Go to Dashboard')).not.toBeInTheDocument()
    })
  })

  describe('Logo and navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createMockAuthContext({}))
    })

    it('should render the Qala logo', () => {
      render(<Header />)

      const logo = screen.getByText('Qala')
      expect(logo).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Header className="custom-class" />)

      const header = screen.getByRole('banner')
      expect(header).toHaveClass('custom-class')
    })
  })
})