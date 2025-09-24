'use client'

/**
 * Profile Edit Page - Update existing user profile information
 * Allows users to modify their profile data
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
import { ArrowLeft, Save, Camera } from 'lucide-react'

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
  avatarUrl: string
}

interface FormErrors {
  fullName?: string
  nativeLanguage?: string
  targetLanguages?: string
  age?: string
  gender?: string
  country?: string
  timezone?: string
  avatarUrl?: string
  submit?: string
}

export default function ProfileEditPage() {
  const router = useRouter()
  const { profile, updateProfile, refreshProfile, isLoading } = useAuth()

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    nativeLanguage: '',
    targetLanguages: [],
    age: USER_VALIDATION.MINIMUM_AGE,
    gender: '',
    country: '',
    timezone: '',
    avatarUrl: '',
  })

  const [originalData, setOriginalData] = useState<FormData | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      const profileData: FormData = {
        fullName: profile.fullName || '',
        nativeLanguage: profile.nativeLanguage || '',
        targetLanguages: profile.targetLanguages || [],
        age: profile.age || USER_VALIDATION.MINIMUM_AGE,
        gender: profile.gender || '',
        country: profile.country || '',
        timezone: profile.timezone || '',
        avatarUrl: profile.avatarUrl || '',
      }
      setFormData(profileData)
      setOriginalData(profileData)
    }
  }, [profile])

  // Check for changes
  useEffect(() => {
    if (originalData) {
      const hasFormChanges = Object.keys(formData).some(key => {
        const formValue = formData[key as keyof FormData]
        const originalValue = originalData[key as keyof FormData]

        if (Array.isArray(formValue) && Array.isArray(originalValue)) {
          return JSON.stringify(formValue.sort()) !== JSON.stringify(originalValue.sort())
        }
        return formValue !== originalValue
      })
      setHasChanges(hasFormChanges)
    } else {
      // If no original data yet, no changes possible
      setHasChanges(false)
    }
  }, [formData, originalData])

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

    // Avatar URL validation (optional)
    if (formData.avatarUrl && !isValidUrl(formData.avatarUrl)) {
      newErrors.avatarUrl = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
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
        avatarUrl: formData.avatarUrl || undefined,
      })

      if (success) {
        await refreshProfile()
        setOriginalData({ ...formData })
        setHasChanges(false)
        // Show success message or redirect
        router.push('/profile')
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

  const handleCancel = () => {
    if (hasChanges) {
      // eslint-disable-next-line no-alert
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to discard them?')
      if (!confirmDiscard) {
        return
      }
    }
    router.back()
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
              <p className="text-muted-foreground">Update your information</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {formData.avatarUrl ? (
                      <Image
                        src={formData.avatarUrl}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <FormField>
                  <Input
                    label="Avatar URL (Optional)"
                    value={formData.avatarUrl}
                    onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    error={errors.avatarUrl}
                  />
                  <FormDescription>
                    Enter a URL to your profile picture
                  </FormDescription>
                </FormField>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
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
                      onChange={(e) => handleInputChange('age', parseInt(e.target.value) || USER_VALIDATION.MINIMUM_AGE)}
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

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !hasChanges}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}