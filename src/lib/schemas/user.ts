import { z } from 'zod'

// Supported languages for the platform
export const supportedLanguages = [
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'ru',
  'ja',
  'ko',
  'zh',
  'ar',
  'hi',
  'th',
  'vi',
  'nl',
  'sv',
  'no',
  'da',
  'fi',
  'pl',
] as const

export type SupportedLanguage = (typeof supportedLanguages)[number]

// User registration schema
export const userRegistrationSchema = z
  .object({
    email: z
      .string()
      .email('Please enter a valid email address')
      .min(3, 'Email must be at least 3 characters')
      .max(255, 'Email must not exceed 255 characters'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),

    confirmPassword: z.string(),

    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(255, 'Full name must not exceed 255 characters')
      .regex(
        /^[a-zA-Z\s\-'\.]+$/,
        'Full name can only contain letters, spaces, hyphens, apostrophes, and periods'
      ),

    nativeLanguage: z.enum(supportedLanguages, {
      message: 'Please select your native language',
    }),

    targetLanguages: z
      .array(z.enum(supportedLanguages))
      .min(1, 'Please select at least one target language')
      .max(5, 'You can select up to 5 target languages')
      .refine(
        languages => new Set(languages).size === languages.length,
        'Target languages must be unique'
      ),

    age: z
      .number()
      .min(16, 'You must be at least 16 years old to use QALA')
      .max(120, 'Please enter a valid age'),

    gender: z
      .enum(['male', 'female', 'non-binary', 'prefer-not-to-say'], {
        message: 'Please select your gender',
      })
      .optional(),

    country: z
      .string()
      .length(3, 'Country code must be exactly 3 characters')
      .regex(/^[A-Z]{3}$/, 'Country code must be in ISO 3166-1 alpha-3 format (e.g., USA, GBR)'),

    timezone: z
      .string()
      .min(3, 'Timezone is required')
      .max(50, 'Timezone must not exceed 50 characters')
      .regex(
        /^[A-Za-z_\/]+\/[A-Za-z_\/]+$/,
        'Timezone must be in IANA format (e.g., America/New_York)'
      ),

    termsAccepted: z
      .boolean()
      .refine(val => val === true, 'You must accept the terms and conditions'),

    privacyAccepted: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(data => !data.targetLanguages.includes(data.nativeLanguage), {
    message: 'Target languages cannot include your native language',
    path: ['targetLanguages'],
  })

// User profile update schema (excludes password and email)
export const userProfileUpdateSchema = userRegistrationSchema
  .omit({
    email: true,
    password: true,
    confirmPassword: true,
    termsAccepted: true,
    privacyAccepted: true,
  })
  .partial()
  .extend({
    avatarUrl: z.string().url('Avatar URL must be a valid URL').optional(),
    proficiencyLevels: z
      .record(
        z.enum(supportedLanguages),
        z.enum(['beginner', 'intermediate', 'advanced', 'native'])
      )
      .optional(),
  })

// Login schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(3, 'Email must be at least 3 characters'),

  password: z.string().min(1, 'Password is required'),

  rememberMe: z.boolean().optional(),
})

// Password reset schema
export const passwordResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

// New password schema
export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),

    confirmPassword: z.string(),

    token: z.string().min(1, 'Reset token is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Matching preferences schema
export const matchingPreferencesSchema = z
  .object({
    targetLanguage: z.enum(supportedLanguages, {
      message: 'Please select a target language',
    }),

    preferredAgeMin: z
      .number()
      .min(16, 'Minimum age must be at least 16')
      .max(120, 'Please enter a valid minimum age')
      .optional(),

    preferredAgeMax: z
      .number()
      .min(16, 'Maximum age must be at least 16')
      .max(120, 'Please enter a valid maximum age')
      .optional(),

    preferredGender: z.enum(['male', 'female', 'non-binary', 'any']).optional(),

    preferredProficiency: z.enum(['beginner', 'intermediate', 'advanced', 'any']).optional(),
  })
  .refine(
    data => {
      if (data.preferredAgeMin && data.preferredAgeMax) {
        return data.preferredAgeMin <= data.preferredAgeMax
      }
      return true
    },
    {
      message: 'Minimum age must be less than or equal to maximum age',
      path: ['preferredAgeMax'],
    }
  )

// Type exports
export type UserRegistration = z.infer<typeof userRegistrationSchema>
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>
export type Login = z.infer<typeof loginSchema>
export type PasswordReset = z.infer<typeof passwordResetSchema>
export type NewPassword = z.infer<typeof newPasswordSchema>
export type MatchingPreferences = z.infer<typeof matchingPreferencesSchema>
