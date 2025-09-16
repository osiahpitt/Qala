import { z } from 'zod'

export const emailSignupSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
})

export type EmailSignupInput = z.infer<typeof emailSignupSchema>

export const validateEmail = (email: string): {
  success: boolean;
  error?: string;
  normalizedEmail?: string
} => {
  try {
    const result = emailSignupSchema.parse({ email })
    return { success: true, normalizedEmail: result.email }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Use format to get the error messages
      const formattedError = error.format()
      const emailError = formattedError.email?._errors?.[0]
      return { success: false, error: emailError || 'Invalid email' }
    }
    return { success: false, error: 'Validation failed' }
  }
}