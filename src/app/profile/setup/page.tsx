'use client'

/**
 * Profile Setup Page - First-time profile completion after signup
 * Collects required user information for platform use
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Button,
  Form,
  FormField,
  FormLabel,
  FormDescription,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  MultiSelect,
  type MultiSelectOption,
} from '@/components/ui'
import { supportedLanguages, type SupportedLanguage } from '@/lib/schemas/user'
import { USER_VALIDATION } from '@/lib/constants'

/**
 * Language options for selection
 */
const languageOptions: MultiSelectOption[] = supportedLanguages.map(lang => ({
  value: lang,
  label: getLanguageLabel(lang),
}))

function getLanguageLabel(langCode: SupportedLanguage): string {
  const labels: Record<SupportedLanguage, string> = {
    en: 'English',
    es: 'Spanish (Español)',
    fr: 'French (Français)',
    de: 'German (Deutsch)',
    it: 'Italian (Italiano)',
    pt: 'Portuguese (Português)',
    ru: 'Russian (Русский)',
    ja: 'Japanese (日本語)',
    ko: 'Korean (한국어)',
    zh: 'Chinese (中文)',
    ar: 'Arabic (العربية)',
    hi: 'Hindi (हिन्दी)',
    th: 'Thai (ไทย)',
    vi: 'Vietnamese (Tiếng Việt)',
    nl: 'Dutch (Nederlands)',
    sv: 'Swedish (Svenska)',
    no: 'Norwegian (Norsk)',
    da: 'Danish (Dansk)',
    fi: 'Finnish (Suomi)',
    pl: 'Polish (Polski)',
  }
  return labels[langCode] || langCode
}

/**
 * Country options (ISO 3166-1 alpha-3)
 */
const countryOptions = [
  { value: 'USA', label: 'United States' },
  { value: 'CAN', label: 'Canada' },
  { value: 'GBR', label: 'United Kingdom' },
  { value: 'DEU', label: 'Germany' },
  { value: 'FRA', label: 'France' },
  { value: 'ESP', label: 'Spain' },
  { value: 'ITA', label: 'Italy' },
  { value: 'NLD', label: 'Netherlands' },
  { value: 'SWE', label: 'Sweden' },
  { value: 'NOR', label: 'Norway' },
  { value: 'DNK', label: 'Denmark' },
  { value: 'FIN', label: 'Finland' },
  { value: 'POL', label: 'Poland' },
  { value: 'JPN', label: 'Japan' },
  { value: 'KOR', label: 'South Korea' },
  { value: 'CHN', label: 'China' },
  { value: 'IND', label: 'India' },
  { value: 'BRA', label: 'Brazil' },
  { value: 'MEX', label: 'Mexico' },
  { value: 'AUS', label: 'Australia' },
]

/**
 * Timezone options (common ones)
 */
const timezoneOptions = [
  { value: 'America/New_York', label: 'Eastern Time (UTC-5/-4)' },
  { value: 'America/Chicago', label: 'Central Time (UTC-6/-5)' },
  { value: 'America/Denver', label: 'Mountain Time (UTC-7/-6)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (UTC-8/-7)' },
  { value: 'Europe/London', label: 'London (UTC+0/+1)' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1/+2)' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1/+2)' },
  { value: 'Europe/Madrid', label: 'Madrid (UTC+1/+2)' },
  { value: 'Europe/Rome', label: 'Rome (UTC+1/+2)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (UTC+1/+2)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Asia/Seoul', label: 'Seoul (UTC+9)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)' },
  { value: 'Asia/Mumbai', label: 'Mumbai (UTC+5:30)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+10/+11)' },
]

interface FormData {
  fullName: string
  nativeLanguage: string
  targetLanguages: string[]
  age: number
  gender: string
  country: string
  timezone: string
}

interface FormErrors {
  fullName?: string
  nativeLanguage?: string
  targetLanguages?: string
  age?: string
  gender?: string
  country?: string
  timezone?: string
  submit?: string
}

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, updateProfile, refreshProfile } = useAuth()

  const [formData, setFormData] = useState<FormData>({
    fullName: user?.user_metadata?.full_name || '',
    nativeLanguage: user?.user_metadata?.native_language || '',
    targetLanguages: user?.user_metadata?.target_languages || [],
    age: user?.user_metadata?.age || 16,
    gender: user?.user_metadata?.gender || '',
    country: user?.user_metadata?.country || '',
    timezone: user?.user_metadata?.timezone || '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-detect timezone on mount
  useState(() => {
    if (!formData.timezone) {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (timezoneOptions.some(option => option.value === detectedTimezone)) {
        setFormData(prev => ({ ...prev, timezone: detectedTimezone }))
      }
    }
  })

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.length < USER_VALIDATION.NAME_MIN_LENGTH) {
      newErrors.fullName = `Full name must be at least ${USER_VALIDATION.NAME_MIN_LENGTH} characters`
    } else if (formData.fullName.length > USER_VALIDATION.FULL_NAME_MAX_LENGTH) {
      newErrors.fullName = `Full name must not exceed ${USER_VALIDATION.FULL_NAME_MAX_LENGTH} characters`
    } else if (!/^[a-zA-Z\s\-'\.]+$/.test(formData.fullName)) {
      newErrors.fullName = 'Full name can only contain letters, spaces, hyphens, apostrophes, and periods'
    }

    // Native language validation
    if (!formData.nativeLanguage) {
      newErrors.nativeLanguage = 'Please select your native language'
    }

    // Target languages validation
    if (formData.targetLanguages.length === 0) {
      newErrors.targetLanguages = 'Please select at least one target language'
    } else if (formData.targetLanguages.length > USER_VALIDATION.MAX_TARGET_LANGUAGES) {
      newErrors.targetLanguages = `You can select up to ${USER_VALIDATION.MAX_TARGET_LANGUAGES} target languages`
    } else if (formData.targetLanguages.includes(formData.nativeLanguage)) {
      newErrors.targetLanguages = 'Target languages cannot include your native language'
    }

    // Age validation
    if (formData.age < USER_VALIDATION.MINIMUM_AGE) {
      newErrors.age = `You must be at least ${USER_VALIDATION.MINIMUM_AGE} years old`
    } else if (formData.age > USER_VALIDATION.MAXIMUM_AGE) {
      newErrors.age = 'Please enter a valid age'
    }

    // Country validation
    if (!formData.country) {
      newErrors.country = 'Please select your country'
    }

    // Timezone validation
    if (!formData.timezone) {
      newErrors.timezone = 'Please select your timezone'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const success = await updateProfile({
        fullName: formData.fullName.trim(),
        nativeLanguage: formData.nativeLanguage,
        targetLanguages: formData.targetLanguages,
        age: formData.age,
        gender: formData.gender || undefined,
        country: formData.country,
        timezone: formData.timezone,
      })

      if (success) {
        await refreshProfile()
        router.push('/dashboard')
      } else {
        setErrors({ submit: 'Failed to update profile. Please try again.' })
      }
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Tell us about yourself to start your language learning journey
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <Form onSubmit={handleSubmit}>
            {/* Full Name */}
            <FormField>
              <Input
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                required
                error={errors.fullName}
                maxLength={USER_VALIDATION.FULL_NAME_MAX_LENGTH}
              />
            </FormField>

            {/* Native Language */}
            <FormField>
              <FormLabel required>Native Language</FormLabel>
              <Select
                value={formData.nativeLanguage}
                onValueChange={(value) => handleInputChange('nativeLanguage', value)}
              >
                <SelectTrigger className={errors.nativeLanguage ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select your native language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nativeLanguage && (
                <FormMessage>{errors.nativeLanguage}</FormMessage>
              )}
            </FormField>

            {/* Target Languages */}
            <FormField>
              <MultiSelect
                label="Target Languages"
                options={languageOptions.filter(lang => lang.value !== formData.nativeLanguage)}
                value={formData.targetLanguages}
                onChange={(value) => handleInputChange('targetLanguages', value)}
                placeholder="Select languages you want to learn"
                maxSelections={USER_VALIDATION.MAX_TARGET_LANGUAGES}
                required
                error={errors.targetLanguages}
              />
              <FormDescription>
                Choose up to {USER_VALIDATION.MAX_TARGET_LANGUAGES} languages you want to practice
              </FormDescription>
            </FormField>

            {/* Age and Gender Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField>
                <Input
                  label="Age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 16)}
                  min={USER_VALIDATION.MINIMUM_AGE}
                  max={USER_VALIDATION.MAXIMUM_AGE}
                  required
                  error={errors.age}
                />
              </FormField>

              <FormField>
                <FormLabel>Gender (Optional)</FormLabel>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Country */}
            <FormField>
              <FormLabel required>Country</FormLabel>
              <Select
                value={formData.country}
                onValueChange={(value) => handleInputChange('country', value)}
              >
                <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <FormMessage>{errors.country}</FormMessage>
              )}
            </FormField>

            {/* Timezone */}
            <FormField>
              <FormLabel required>Timezone</FormLabel>
              <Select
                value={formData.timezone}
                onValueChange={(value) => handleInputChange('timezone', value)}
              >
                <SelectTrigger className={errors.timezone ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timezone && (
                <FormMessage>{errors.timezone}</FormMessage>
              )}
              <FormDescription>
                This helps us match you with people in compatible time zones
              </FormDescription>
            </FormField>

            {/* Submit Error */}
            {errors.submit && (
              <FormMessage>{errors.submit}</FormMessage>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Setting up your profile...' : 'Complete Profile'}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  )
}