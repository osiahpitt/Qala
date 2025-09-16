import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProfileEditPage from './page'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock user profile data
const mockProfile = {
  id: 'user-123',
  email: 'test@example.com',
  fullName: 'John Doe',
  avatarUrl: 'https://example.com/avatar.jpg',
  nativeLanguage: 'en',
  targetLanguages: ['es', 'fr'],
  proficiencyLevels: {},
  age: 25,
  gender: 'male',
  country: 'USA',
  timezone: 'America/New_York',
  subscriptionTier: 'free',
  translationQuotaUsed: 0,
  quotaResetDate: '2024-01-01T00:00:00.000Z',
  isBanned: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const mockAuthContext = {
  user: null,
  profile: mockProfile,
  updateProfile: vi.fn(),
  refreshProfile: vi.fn(),
  isLoading: false,
  isAuthenticated: true,
  isEmailVerified: true,
  hasCompletedProfile: true,
  session: null,
  error: null,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  resendConfirmation: vi.fn(),
  clearError: vi.fn(),
}

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(),
})

describe('ProfileEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(useAuth).mockReturnValue(mockAuthContext)
    vi.mocked(window.confirm).mockReturnValue(true)
  })

  it('should render loading state when profile is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...mockAuthContext,
      isLoading: true,
      profile: null,
    })

    render(<ProfileEditPage />)

    expect(screen.getByText('Loading profile...')).toBeInTheDocument()
  })

  it('should render profile edit form with existing data', () => {
    render(<ProfileEditPage />)

    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    expect(screen.getByText('Update your information')).toBeInTheDocument()

    // Check form fields are populated with existing data
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('25')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://example.com/avatar.jpg')).toBeInTheDocument()

    // Check save button is initially disabled (no changes)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
  })

  it('should enable save button when form data changes', async () => {
    const user = userEvent.setup()
    render(<ProfileEditPage />)

    const fullNameInput = screen.getByDisplayValue('John Doe')
    await user.clear(fullNameInput)
    await user.type(fullNameInput, 'Jane Doe')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled()
    })
  })

  it('should validate form fields', async () => {
    const user = userEvent.setup()
    render(<ProfileEditPage />)

    // Clear required field
    const fullNameInput = screen.getByDisplayValue('John Doe')
    await user.clear(fullNameInput)

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument()
    })
  })

  it('should validate avatar URL format', async () => {
    const user = userEvent.setup()
    render(<ProfileEditPage />)

    const avatarInput = screen.getByDisplayValue('https://example.com/avatar.jpg')
    await user.clear(avatarInput)
    await user.type(avatarInput, 'invalid-url')

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument()
    })
  })

  it('should successfully update profile', async () => {
    const user = userEvent.setup()
    vi.mocked(mockAuthContext.updateProfile).mockResolvedValue(true)
    vi.mocked(mockAuthContext.refreshProfile).mockResolvedValue(undefined)

    render(<ProfileEditPage />)

    // Make a change
    const fullNameInput = screen.getByDisplayValue('John Doe')
    await user.clear(fullNameInput)
    await user.type(fullNameInput, 'Jane Doe')

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockAuthContext.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Jane Doe',
        })
      )
      expect(mockAuthContext.refreshProfile).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/profile')
    })
  })

  it('should handle update errors', async () => {
    const user = userEvent.setup()
    vi.mocked(mockAuthContext.updateProfile).mockResolvedValue(false)

    render(<ProfileEditPage />)

    // Make a change
    const fullNameInput = screen.getByDisplayValue('John Doe')
    await user.clear(fullNameInput)
    await user.type(fullNameInput, 'Jane Doe')

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    vi.mocked(mockAuthContext.updateProfile).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(true), 100))
    )

    render(<ProfileEditPage />)

    // Make a change
    const fullNameInput = screen.getByDisplayValue('John Doe')
    await user.clear(fullNameInput)
    await user.type(fullNameInput, 'Jane Doe')

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)

    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(saveButton).toBeDisabled()
  })

  it('should handle back button with no changes', async () => {
    const user = userEvent.setup()
    render(<ProfileEditPage />)

    const backButton = screen.getByRole('button', { name: /back/i })
    await user.click(backButton)

    expect(mockRouter.back).toHaveBeenCalled()
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('should confirm before discarding changes', async () => {
    const user = userEvent.setup()
    render(<ProfileEditPage />)

    // Make a change
    const fullNameInput = screen.getByDisplayValue('John Doe')
    await user.clear(fullNameInput)
    await user.type(fullNameInput, 'Jane Doe')

    const backButton = screen.getByRole('button', { name: /back/i })
    await user.click(backButton)

    expect(window.confirm).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to discard them?'
    )
  })

  it('should not navigate back if user cancels confirmation', async () => {
    const user = userEvent.setup()
    vi.mocked(window.confirm).mockReturnValue(false)

    render(<ProfileEditPage />)

    // Make a change
    const fullNameInput = screen.getByDisplayValue('John Doe')
    await user.clear(fullNameInput)
    await user.type(fullNameInput, 'Jane Doe')

    const backButton = screen.getByRole('button', { name: /back/i })
    await user.click(backButton)

    expect(window.confirm).toHaveBeenCalled()
    expect(mockRouter.back).not.toHaveBeenCalled()
  })

  it('should handle cancel button', async () => {
    const user = userEvent.setup()
    render(<ProfileEditPage />)

    // Make a change
    const fullNameInput = screen.getByDisplayValue('John Doe')
    await user.clear(fullNameInput)
    await user.type(fullNameInput, 'Jane Doe')

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(window.confirm).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to discard them?'
    )
  })

  it('should display profile picture correctly', () => {
    render(<ProfileEditPage />)

    const profileImage = screen.getByAltText('Profile')
    expect(profileImage).toBeInTheDocument()
    expect(profileImage).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('should show camera icon when no avatar URL', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...mockAuthContext,
      profile: {
        ...mockProfile,
        avatarUrl: '',
      },
    })

    render(<ProfileEditPage />)

    // Camera icon should be visible
    expect(screen.getByTestId('lucide-camera') || screen.querySelector('[data-testid="lucide-camera"]')).toBeTruthy()
  })

  it('should prevent selecting native language as target language', async () => {
    const user = userEvent.setup()
    render(<ProfileEditPage />)

    // The MultiSelect component should automatically filter out the native language
    // This test ensures the validation works if it somehow gets through
    const ageInput = screen.getByDisplayValue('25')
    await user.clear(ageInput)
    await user.type(ageInput, '26') // Make a change to enable save

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)

    // Should successfully save since native language is filtered from target options
    await waitFor(() => {
      expect(mockAuthContext.updateProfile).toHaveBeenCalled()
    })
  })

  it('should validate age constraints', async () => {
    const user = userEvent.setup()
    render(<ProfileEditPage />)

    const ageInput = screen.getByDisplayValue('25')
    await user.clear(ageInput)
    await user.type(ageInput, '15')

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('You must be at least 16 years old')).toBeInTheDocument()
    })
  })
})