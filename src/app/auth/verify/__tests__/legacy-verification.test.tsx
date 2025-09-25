/**
 * Tests for legacy email verification link handling
 * Ensures that old verification tokens are gracefully handled
 */

import { render, screen, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createUserProfile } from '@/lib/auth'
import VerifyPage from '../page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      verifyOtp: jest.fn(),
    },
  },
}))

// Mock auth utils
jest.mock('@/lib/auth', () => ({
  createUserProfile: jest.fn(),
}))

describe('Legacy Verification Link Handling', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(createUserProfile as jest.Mock).mockResolvedValue(true)
  })

  it('should show legacy message for "requested path is invalid" error', async () => {
    // Simulate legacy verification link parameters
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param: string) => {
        if (param === 'token') return 'legacy-token-123'
        if (param === 'type') return 'signup'
        return null
      }),
    })

    // Mock Supabase to return "requested path is invalid" error
    ;(supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'requested path is invalid' }
    })

    render(<VerifyPage />)

    // Wait for the component to process the legacy token
    await waitFor(() => {
      expect(screen.getByText('Verification Link Expired')).toBeInTheDocument()
    })

    expect(screen.getByText(/This verification link is from an older email/)).toBeInTheDocument()
    expect(screen.getByText(/Don't worry - we can send you a new verification code/)).toBeInTheDocument()
    expect(screen.getByText('Get New Verification Code')).toBeInTheDocument()
  })

  it('should show legacy message for invalid token errors', async () => {
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param: string) => {
        if (param === 'token') return 'invalid-legacy-token'
        if (param === 'type') return 'signup'
        return null
      }),
    })

    // Mock Supabase to return invalid token error
    ;(supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Invalid token hash' }
    })

    render(<VerifyPage />)

    await waitFor(() => {
      expect(screen.getByText('Verification Link Expired')).toBeInTheDocument()
    })
  })

  it('should show legacy message for expired token errors', async () => {
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param: string) => {
        if (param === 'token') return 'expired-legacy-token'
        if (param === 'type') return 'signup'
        return null
      }),
    })

    // Mock Supabase to return expired token error
    ;(supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Token has expired' }
    })

    render(<VerifyPage />)

    await waitFor(() => {
      expect(screen.getByText('Verification Link Expired')).toBeInTheDocument()
    })
  })

  it('should handle successful verification for newer tokens', async () => {
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param: string) => {
        if (param === 'token') return 'valid-new-token'
        if (param === 'type') return 'signup'
        return null
      }),
    })

    // Mock successful verification
    ;(supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      },
      error: null
    })

    render(<VerifyPage />)

    await waitFor(() => {
      expect(screen.getByText('Email Verified!')).toBeInTheDocument()
    })

    // Should create user profile and redirect
    expect(createUserProfile).toHaveBeenCalled()

    // Should redirect to profile setup after delay
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/profile/setup')
    }, { timeout: 3000 })
  })

  it('should show generic error for other types of errors', async () => {
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param: string) => {
        if (param === 'token') return 'some-token'
        if (param === 'type') return 'signup'
        return null
      }),
    })

    // Mock a different type of error
    ;(supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Network error occurred' }
    })

    render(<VerifyPage />)

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Network error occurred')).toBeInTheDocument()
  })

  it('should handle missing or invalid parameters', async () => {
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn(() => null),
    })

    render(<VerifyPage />)

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument()
    })

    expect(screen.getByText('Invalid verification link')).toBeInTheDocument()
  })
})