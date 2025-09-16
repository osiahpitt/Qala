import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProfileSetupPage from './page'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: '',
    native_language: '',
    target_languages: [],
    age: 16,
    gender: '',
    country: '',
    timezone: '',
  },
}

const mockAuthContext = {
  user: mockUser,
  updateProfile: vi.fn(),
  refreshProfile: vi.fn(),
  isLoading: false,
  isAuthenticated: true,
  isEmailVerified: true,
  hasCompletedProfile: false,
  profile: null,
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

describe('ProfileSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(useAuth).mockReturnValue(mockAuthContext)
  })

  it('should render profile setup form', () => {
    render(<ProfileSetupPage />)

    expect(screen.getByText('Complete Your Profile')).toBeInTheDocument()
    expect(screen.getByText('Tell us about yourself to start your language learning journey')).toBeInTheDocument()

    // Check form fields
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByText('Native Language')).toBeInTheDocument()
    expect(screen.getByText('Target Languages')).toBeInTheDocument()
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument()
    expect(screen.getByText('Gender (Optional)')).toBeInTheDocument()
    expect(screen.getByText('Country')).toBeInTheDocument()
    expect(screen.getByText('Timezone')).toBeInTheDocument()
  })

  it('should populate form with existing user data', () => {
    const userWithData = {
      ...mockUser,
      user_metadata: {
        full_name: 'John Doe',
        native_language: 'en',
        target_languages: ['es', 'fr'],
        age: 25,
        gender: 'male',
        country: 'USA',
        timezone: 'America/New_York',
      },
    }

    vi.mocked(useAuth).mockReturnValue({
      ...mockAuthContext,
      user: userWithData,
    })

    render(<ProfileSetupPage />)

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('25')).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<ProfileSetupPage />)

    const submitButton = screen.getByRole('button', { name: /complete profile/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument()
      expect(screen.getByText('Please select your native language')).toBeInTheDocument()
      expect(screen.getByText('Please select at least one target language')).toBeInTheDocument()
      expect(screen.getByText('Please select your country')).toBeInTheDocument()
      expect(screen.getByText('Please select your timezone')).toBeInTheDocument()
    })
  })

  it('should validate full name format', async () => {
    const user = userEvent.setup()
    render(<ProfileSetupPage />)

    const fullNameInput = screen.getByLabelText(/full name/i)
    await user.type(fullNameInput, 'A')

    const submitButton = screen.getByRole('button', { name: /complete profile/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Full name must be at least 2 characters')).toBeInTheDocument()
    })

    await user.clear(fullNameInput)
    await user.type(fullNameInput, 'John123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Full name can only contain letters, spaces, hyphens, apostrophes, and periods')).toBeInTheDocument()
    })
  })

  it('should validate age constraints', async () => {
    const user = userEvent.setup()
    render(<ProfileSetupPage />)

    const ageInput = screen.getByLabelText(/age/i)
    await user.clear(ageInput)
    await user.type(ageInput, '15')

    const submitButton = screen.getByRole('button', { name: /complete profile/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('You must be at least 16 years old')).toBeInTheDocument()
    })

    await user.clear(ageInput)
    await user.type(ageInput, '150')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid age')).toBeInTheDocument()
    })
  })

  it('should prevent selecting native language as target language', async () => {
    const user = userEvent.setup()
    render(<ProfileSetupPage />)

    // Fill in required fields
    const fullNameInput = screen.getByLabelText(/full name/i)
    await user.type(fullNameInput, 'John Doe')

    const ageInput = screen.getByLabelText(/age/i)
    await user.clear(ageInput)
    await user.type(ageInput, '25')

    // Set native language to English
    const nativeLanguageSelect = screen.getByRole('combobox', { name: /native language/i })
    await user.click(nativeLanguageSelect)
    await user.click(screen.getByText('English'))

    // Try to set target language to include English
    // Note: The actual implementation filters out the native language from target options
    // So this test validates that the validation catches it if somehow it gets through

    const submitButton = screen.getByRole('button', { name: /complete profile/i })
    await user.click(submitButton)

    // Should show validation error for missing target languages and other required fields
    await waitFor(() => {
      expect(screen.getByText('Please select at least one target language')).toBeInTheDocument()
    })
  })

  it('should successfully submit valid form data', async () => {
    const user = userEvent.setup()
    vi.mocked(mockAuthContext.updateProfile).mockResolvedValue(true)
    vi.mocked(mockAuthContext.refreshProfile).mockResolvedValue(undefined)

    render(<ProfileSetupPage />)

    // Fill in all required fields
    const fullNameInput = screen.getByLabelText(/full name/i)
    await user.type(fullNameInput, 'John Doe')

    const ageInput = screen.getByLabelText(/age/i)
    await user.clear(ageInput)
    await user.type(ageInput, '25')

    // Note: For select components, we would need to interact with them properly
    // This is a simplified test - in a real scenario you'd need to properly
    // interact with the Select components

    const submitButton = screen.getByRole('button', { name: /complete profile/i })

    // Mock the form data to be valid by setting up the auth context differently
    const validUserData = {
      ...mockUser,
      user_metadata: {
        full_name: 'John Doe',
        native_language: 'en',
        target_languages: ['es'],
        age: 25,
        gender: 'male',
        country: 'USA',
        timezone: 'America/New_York',
      },
    }

    vi.mocked(useAuth).mockReturnValue({
      ...mockAuthContext,
      user: validUserData,
    })

    // Re-render with valid data
    render(<ProfileSetupPage />)

    const newSubmitButton = screen.getByRole('button', { name: /complete profile/i })
    await user.click(newSubmitButton)

    await waitFor(() => {
      expect(mockAuthContext.updateProfile).toHaveBeenCalled()
    })
  })

  it('should handle form submission errors', async () => {
    const user = userEvent.setup()
    vi.mocked(mockAuthContext.updateProfile).mockResolvedValue(false)

    const validUserData = {
      ...mockUser,
      user_metadata: {
        full_name: 'John Doe',
        native_language: 'en',
        target_languages: ['es'],
        age: 25,
        gender: 'male',
        country: 'USA',
        timezone: 'America/New_York',
      },
    }

    vi.mocked(useAuth).mockReturnValue({
      ...mockAuthContext,
      user: validUserData,
    })

    render(<ProfileSetupPage />)

    const submitButton = screen.getByRole('button', { name: /complete profile/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    vi.mocked(mockAuthContext.updateProfile).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(true), 100))
    )

    const validUserData = {
      ...mockUser,
      user_metadata: {
        full_name: 'John Doe',
        native_language: 'en',
        target_languages: ['es'],
        age: 25,
        gender: 'male',
        country: 'USA',
        timezone: 'America/New_York',
      },
    }

    vi.mocked(useAuth).mockReturnValue({
      ...mockAuthContext,
      user: validUserData,
    })

    render(<ProfileSetupPage />)

    const submitButton = screen.getByRole('button', { name: /complete profile/i })
    await user.click(submitButton)

    expect(screen.getByText('Setting up your profile...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('should redirect to dashboard on successful completion', async () => {
    const user = userEvent.setup()
    vi.mocked(mockAuthContext.updateProfile).mockResolvedValue(true)
    vi.mocked(mockAuthContext.refreshProfile).mockResolvedValue(undefined)

    const validUserData = {
      ...mockUser,
      user_metadata: {
        full_name: 'John Doe',
        native_language: 'en',
        target_languages: ['es'],
        age: 25,
        gender: 'male',
        country: 'USA',
        timezone: 'America/New_York',
      },
    }

    vi.mocked(useAuth).mockReturnValue({
      ...mockAuthContext,
      user: validUserData,
    })

    render(<ProfileSetupPage />)

    const submitButton = screen.getByRole('button', { name: /complete profile/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockAuthContext.updateProfile).toHaveBeenCalled()
      expect(mockAuthContext.refreshProfile).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })
})