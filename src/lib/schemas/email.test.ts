import { describe, it, expect } from 'vitest'
import { validateEmail } from './email'

describe('validateEmail', () => {
  it('validates correct email addresses', () => {
    const result = validateEmail('test@example.com')
    expect(result.success).toBe(true)
    expect(result.normalizedEmail).toBe('test@example.com')
  })

  it('normalizes email to lowercase and trims whitespace', () => {
    const result = validateEmail('  TEST@EXAMPLE.COM  ')
    expect(result.success).toBe(true)
    expect(result.normalizedEmail).toBe('test@example.com')
  })

  it('rejects invalid email formats', () => {
    const result = validateEmail('notanemail')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Please enter a valid email address')
  })

  it('rejects empty email', () => {
    const result = validateEmail('')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Email is required')
  })

  it('rejects email that is just whitespace', () => {
    const result = validateEmail('   ')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Email is required')
  })
})