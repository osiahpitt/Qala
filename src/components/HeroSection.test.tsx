import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  const mockOnEmailSubmit = vi.fn()
  const defaultProps = {
    headline: 'Test Headline',
    subheadline: 'Test Subheadline',
    pricing: 'Test Pricing',
    ctaText: 'Get Started',
    onEmailSubmit: mockOnEmailSubmit,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders all required content', () => {
      render(<HeroSection {...defaultProps} />)

      expect(screen.getByText('Test Headline')).toBeInTheDocument()
      expect(screen.getByText('Test Pricing')).toBeInTheDocument()
      expect(screen.getByText('Test Subheadline')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('Email Address')
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument()
    })

    it('renders with background image when provided', () => {
      render(<HeroSection {...defaultProps} backgroundImage="/test-bg.jpg" />)

      const image = screen.getByAltText('QALA Hero Background')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', expect.stringContaining('test-bg.jpg'))
    })

    it('renders gradient background when no image provided', () => {
      const { container } = render(<HeroSection {...defaultProps} />)

      const gradientBg = container.querySelector('.netflix-hero-background')
      expect(gradientBg).toBeInTheDocument()
    })
  })

  describe('Email Input Validation', () => {
    it('shows error for invalid email format', async () => {
      const user = userEvent.setup()
      render(<HeroSection {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText('Email Address')
      const submitButton = screen.getByRole('button', { name: 'Get Started' })

      await user.type(emailInput, 'notanemail')
      await user.click(submitButton)

      expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument()
      expect(mockOnEmailSubmit).not.toHaveBeenCalled()
    })

    it('shows error for empty email', async () => {
      const user = userEvent.setup()
      render(<HeroSection {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: 'Get Started' })

      await user.click(submitButton)

      expect(await screen.findByText('Email is required')).toBeInTheDocument()
      expect(mockOnEmailSubmit).not.toHaveBeenCalled()
    })

    it('clears error when user starts typing', async () => {
      const user = userEvent.setup()
      render(<HeroSection {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText('Email Address')
      const submitButton = screen.getByRole('button', { name: 'Get Started' })

      // Trigger error
      await user.type(emailInput, 'notanemail')
      await user.click(submitButton)
      expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument()

      // Clear error by typing
      await user.clear(emailInput)
      await user.type(emailInput, 'test@example.com')

      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('submits valid email successfully', async () => {
      const user = userEvent.setup()
      mockOnEmailSubmit.mockResolvedValueOnce(undefined)

      render(<HeroSection {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText('Email Address')
      const submitButton = screen.getByRole('button', { name: 'Get Started' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      expect(mockOnEmailSubmit).toHaveBeenCalledWith('test@example.com')
      expect(await screen.findByText(/Thanks! We'll contact you soon/)).toBeInTheDocument()
    })

    it('handles submission errors gracefully', async () => {
      const user = userEvent.setup()
      mockOnEmailSubmit.mockRejectedValueOnce(new Error('Submission failed'))

      render(<HeroSection {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText('Email Address')
      const submitButton = screen.getByRole('button', { name: 'Get Started' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      expect(await screen.findByText('Submission failed')).toBeInTheDocument()
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      let resolveSubmission: () => void
      const submissionPromise = new Promise<void>((resolve) => {
        resolveSubmission = resolve
      })
      mockOnEmailSubmit.mockReturnValueOnce(submissionPromise)

      render(<HeroSection {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText('Email Address')
      const submitButton = screen.getByRole('button', { name: 'Get Started' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Loading...')).toBeInTheDocument()

      if (resolveSubmission) {
        resolveSubmission()
      }
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('clears email input after successful submission', async () => {
      const user = userEvent.setup()
      mockOnEmailSubmit.mockResolvedValueOnce(undefined)

      render(<HeroSection {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText('Email Address')
      const submitButton = screen.getByRole('button', { name: 'Get Started' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(emailInput).toHaveValue('')
      })
    })
  })

  describe('Button States', () => {
    it('disables submit button when email is empty', () => {
      render(<HeroSection {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: 'Get Started' })
      expect(submitButton).toBeDisabled()
    })

    it('enables submit button when email has content', async () => {
      const user = userEvent.setup()
      render(<HeroSection {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText('Email Address')
      const submitButton = screen.getByRole('button', { name: 'Get Started' })

      await user.type(emailInput, 'test@example.com')

      expect(submitButton).not.toBeDisabled()
    })

    it('disables submit button during submission', async () => {
      const user = userEvent.setup()
      let resolveSubmission: () => void
      const submissionPromise = new Promise<void>((resolve) => {
        resolveSubmission = resolve
      })
      mockOnEmailSubmit.mockReturnValueOnce(submissionPromise)

      render(<HeroSection {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText('Email Address')
      const submitButton = screen.getByRole('button', { name: 'Get Started' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      expect(submitButton).toBeDisabled()

      if (resolveSubmission) {
        resolveSubmission()
      }
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes for error state', async () => {
      const user = userEvent.setup()
      render(<HeroSection {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText('Email Address')
      const submitButton = screen.getByRole('button', { name: 'Get Started' })

      await user.type(emailInput, 'notanemail')
      await user.click(submitButton)

      expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')

      const errorElement = screen.getByRole('alert')
      expect(errorElement).toHaveAttribute('id', 'email-error')
    })

    it('has proper ARIA attributes for valid state', () => {
      render(<HeroSection {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText('Email Address')
      expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      expect(emailInput).not.toHaveAttribute('aria-describedby')
    })
  })

  describe('Email Trimming and Normalization', () => {
    it('trims whitespace from email before validation', async () => {
      const user = userEvent.setup()
      mockOnEmailSubmit.mockResolvedValueOnce(undefined)

      render(<HeroSection {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText('Email Address')
      const submitButton = screen.getByRole('button', { name: 'Get Started' })

      await user.type(emailInput, '  test@example.com  ')
      await user.click(submitButton)

      expect(mockOnEmailSubmit).toHaveBeenCalledWith('test@example.com')
    })

    it('normalizes email (lowercase and trim) before submission', async () => {
      const user = userEvent.setup()
      mockOnEmailSubmit.mockResolvedValueOnce(undefined)

      render(<HeroSection {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText('Email Address')
      const submitButton = screen.getByRole('button', { name: 'Get Started' })

      await user.type(emailInput, '  Test@EXAMPLE.COM  ')
      await user.click(submitButton)

      expect(mockOnEmailSubmit).toHaveBeenCalledWith('test@example.com')
    })
  })
})