'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { userRegistrationSchema, type UserRegistration, supportedLanguages } from '@/lib/schemas/user'
import { USER_VALIDATION, UI_CONFIG } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { QalaButton } from '@/components/ui/QalaButton'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { Form, FormField, FormLabel, FormDescription, FormMessage } from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { MultiSelect, type MultiSelectOption } from '@/components/ui/MultiSelect'

const languageOptions: MultiSelectOption[] = supportedLanguages.map(lang => ({
  value: lang,
  label: getLanguageName(lang),
}))

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    ar: 'Arabic',
    hi: 'Hindi',
    th: 'Thai',
    vi: 'Vietnamese',
    nl: 'Dutch',
    sv: 'Swedish',
    no: 'Norwegian',
    da: 'Danish',
    fi: 'Finnish',
    pl: 'Polish',
  }
  return languages[code] || code.toUpperCase()
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]

export interface SignupFormProps {
  initialEmail?: string
  onSuccess?: () => void
  onEmailConfirmationSent?: (email: string) => void
}

export function SignupForm({ initialEmail, onSuccess, onEmailConfirmationSent }: SignupFormProps) {
  const router = useRouter()
  const { signUp: authSignUp, signInWithGoogle } = useAuth()

  const [formData, setFormData] = useState<Partial<UserRegistration>>({
    email: initialEmail || '',
    password: '',
    confirmPassword: '',
    fullName: '',
    nativeLanguage: 'en',
    targetLanguages: [],
    age: 16,
    gender: undefined,
    country: 'USA',
    timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'America/New_York',
    termsAccepted: false,
    privacyAccepted: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = UI_CONFIG.SIGNUP_TOTAL_STEPS

  // Update email when initialEmail prop changes
  useEffect(() => {
    if (initialEmail && initialEmail !== formData.email) {
      setFormData(prev => ({ ...prev, email: initialEmail }))
    }
  }, [initialEmail, formData.email])

  const handleInputChange = (field: keyof UserRegistration, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.email?.trim()) {
        stepErrors.email = 'Email is required'
      }
      if (!formData.password?.trim()) {
        stepErrors.password = 'Password is required'
      }
      if (!formData.confirmPassword?.trim()) {
        stepErrors.confirmPassword = 'Please confirm your password'
      }
      if (!formData.fullName?.trim()) {
        stepErrors.fullName = 'Full name is required'
      }
    } else if (step === 2) {
      if (!formData.nativeLanguage) {
        stepErrors.nativeLanguage = 'Please select your native language'
      }
      if (!formData.targetLanguages?.length) {
        stepErrors.targetLanguages = 'Please select at least one target language'
      }
      if (!formData.age || formData.age < USER_VALIDATION.MINIMUM_AGE) {
        stepErrors.age = 'You must be at least 16 years old'
      }
    } else if (step === UI_CONFIG.SIGNUP_TOTAL_STEPS) {
      if (!formData.country?.trim()) {
        stepErrors.country = 'Country is required'
      }
      if (!formData.timezone?.trim()) {
        stepErrors.timezone = 'Timezone is required'
      }
      if (!formData.termsAccepted) {
        stepErrors.termsAccepted = 'You must accept the terms and conditions'
      }
      if (!formData.privacyAccepted) {
        stepErrors.privacyAccepted = 'You must accept the privacy policy'
      }
    }

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep(currentStep) || currentStep !== totalSteps) {
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const validatedData = userRegistrationSchema.parse(formData)
      const result = await authSignUp(validatedData)

      if (result.success) {
        if (result.emailConfirmationSent) {
          onEmailConfirmationSent?.(validatedData.email)
        } else {
          onSuccess?.()
          router.push('/profile/setup')
        }
      } else {
        setErrors({ submit: result.error || 'Signup failed' })
      }
    } catch (error) {
      if (error instanceof Error && 'errors' in error) {
        const zodErrors = error as { errors: Array<{ path: string[]; message: string }> }
        const errorMap: Record<string, string> = {}
        zodErrors.errors.forEach(err => {
          if (err.path.length > 0) {
            errorMap[err.path[0]] = err.message
          }
        })
        setErrors(errorMap)
      } else {
        setErrors({ submit: 'Please check your inputs and try again' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true)
      setErrors({})

      const result = await signInWithGoogle()

      if (!result.success) {
        setErrors({ submit: result.error || 'Google signup failed' })
      }
      // If successful, the user will be redirected by Google OAuth
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Google signup failed' })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const availableTargetLanguages = languageOptions.filter(
    option => option.value !== formData.nativeLanguage
  )

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Account Information
              </h2>
              <p className="text-foreground-muted text-sm">
                Create your QALA account to start learning
              </p>
            </div>

            <FormField error={errors.fullName}>
              <FormLabel htmlFor="fullName" required>Full Name</FormLabel>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName || ''}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                error={errors.fullName}
              />
              {errors.fullName && <FormMessage>{errors.fullName}</FormMessage>}
            </FormField>

            <FormField error={errors.email}>
              <FormLabel htmlFor="email" required>Email</FormLabel>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                error={errors.email}
              />
              {errors.email && <FormMessage>{errors.email}</FormMessage>}
            </FormField>

            <FormField error={errors.password}>
              <FormLabel htmlFor="password" required>Password</FormLabel>
              <Input
                id="password"
                type="password"
                value={formData.password || ''}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Create a strong password"
                error={errors.password}
              />
              <FormDescription>
                Must contain uppercase, lowercase, number, and special character
              </FormDescription>
              {errors.password && <FormMessage>{errors.password}</FormMessage>}
            </FormField>

            <FormField error={errors.confirmPassword}>
              <FormLabel htmlFor="confirmPassword" required>Confirm Password</FormLabel>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword || ''}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                error={errors.confirmPassword}
              />
              {errors.confirmPassword && <FormMessage>{errors.confirmPassword}</FormMessage>}
            </FormField>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Language Preferences
              </h2>
              <p className="text-foreground-muted text-sm">
                Tell us about the languages you speak and want to learn
              </p>
            </div>

            <FormField error={errors.nativeLanguage}>
              <FormLabel htmlFor="nativeLanguage" required>Native Language</FormLabel>
              <Select
                value={formData.nativeLanguage || ''}
                onValueChange={(value) => handleInputChange('nativeLanguage', value)}
              >
                <SelectTrigger className={errors.nativeLanguage ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select your native language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The language you speak most fluently
              </FormDescription>
              {errors.nativeLanguage && <FormMessage>{errors.nativeLanguage}</FormMessage>}
            </FormField>

            <FormField error={errors.targetLanguages}>
              <MultiSelect
                label="Target Languages"
                required
                options={availableTargetLanguages}
                value={formData.targetLanguages || []}
                onChange={(value) => handleInputChange('targetLanguages', value)}
                placeholder="Select languages you want to learn"
                maxSelections={5}
                error={errors.targetLanguages}
              />
              <FormDescription>
                Choose up to 5 languages you want to practice (excluding your native language)
              </FormDescription>
              {errors.targetLanguages && <FormMessage>{errors.targetLanguages}</FormMessage>}
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField error={errors.age}>
                <FormLabel htmlFor="age" required>Age</FormLabel>
                <Input
                  id="age"
                  type="number"
                  min="16"
                  max="120"
                  value={formData.age || ''}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                  placeholder="Age"
                  error={errors.age}
                />
                {errors.age && <FormMessage>{errors.age}</FormMessage>}
              </FormField>

              <FormField error={errors.gender}>
                <FormLabel htmlFor="gender">Gender (Optional)</FormLabel>
                <Select
                  value={formData.gender || ''}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gender && <FormMessage>{errors.gender}</FormMessage>}
              </FormField>
            </div>
          </div>
        )

      case UI_CONFIG.SIGNUP_TOTAL_STEPS:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Location & Legal
              </h2>
              <p className="text-foreground-muted text-sm">
                Complete your profile and accept our terms
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField error={errors.country}>
                <FormLabel htmlFor="country" required>Country</FormLabel>
                <Input
                  id="country"
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="USA"
                  error={errors.country}
                />
                <FormDescription>ISO 3166-1 alpha-3 code</FormDescription>
                {errors.country && <FormMessage>{errors.country}</FormMessage>}
              </FormField>

              <FormField error={errors.timezone}>
                <FormLabel htmlFor="timezone" required>Timezone</FormLabel>
                <Input
                  id="timezone"
                  type="text"
                  value={formData.timezone || ''}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  placeholder="America/New_York"
                  error={errors.timezone}
                />
                <FormDescription>Auto-detected from your location</FormDescription>
                {errors.timezone && <FormMessage>{errors.timezone}</FormMessage>}
              </FormField>
            </div>

            <div className="space-y-4">
              <FormField error={errors.termsAccepted}>
                <div className="flex items-start space-x-3">
                  <input
                    id="termsAccepted"
                    type="checkbox"
                    checked={formData.termsAccepted || false}
                    onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="termsAccepted" className="text-sm text-foreground">
                      I accept the{' '}
                      <Link href="/terms" className="text-primary hover:text-primary/80" target="_blank">
                        Terms and Conditions
                      </Link>
                    </label>
                    {errors.termsAccepted && <FormMessage>{errors.termsAccepted}</FormMessage>}
                  </div>
                </div>
              </FormField>

              <FormField error={errors.privacyAccepted}>
                <div className="flex items-start space-x-3">
                  <input
                    id="privacyAccepted"
                    type="checkbox"
                    checked={formData.privacyAccepted || false}
                    onChange={(e) => handleInputChange('privacyAccepted', e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="privacyAccepted" className="text-sm text-foreground">
                      I accept the{' '}
                      <Link href="/privacy" className="text-primary hover:text-primary/80" target="_blank">
                        Privacy Policy
                      </Link>
                    </label>
                    {errors.privacyAccepted && <FormMessage>{errors.privacyAccepted}</FormMessage>}
                  </div>
                </div>
              </FormField>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-foreground-muted">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Google OAuth Section - Only show on step 1 */}
      {currentStep === 1 && (
        <div className="mb-6">
          <QalaButton
            type="button"
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading || isSubmitting}
            loading={isGoogleLoading}
            variant="gold"
            className="w-full mb-4"
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            Continue with Google
          </QalaButton>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-foreground-muted">Or continue with email</span>
            </div>
          </div>
        </div>
      )}

      <Form onSubmit={handleSubmit}>
        {renderStep()}

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Account
            </Button>
          )}
        </div>
      </Form>

      <div className="mt-6 text-center">
        <p className="text-foreground-muted">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}