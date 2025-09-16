import { describe, it, expect } from 'vitest'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'

interface User {
  id: string
  email: string
  fullName: string
  nativeLanguage: string
  targetLanguages: string[]
  age: number
  country: string
  timezone: string
}

interface CreateUserResponse {
  success: boolean
  message: string
  user: {
    id: string
    email: string
    fullName: string
  }
}

interface TranslationResponse {
  translatedText: string
  sourceLang: string
  targetLang: string
  confidence: number
}

// Sample API client functions to test MSW integration
async function fetchUser(): Promise<User> {
  const response = await fetch('/api/user')
  if (!response.ok) {
    throw new Error('Failed to fetch user')
  }
  return response.json()
}

async function createUser(userData: { email: string; fullName: string }): Promise<CreateUserResponse> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
  if (!response.ok) {
    throw new Error('Failed to create user')
  }
  return response.json()
}

async function translateText(text: string, targetLang: string): Promise<TranslationResponse> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, targetLang }),
  })
  if (!response.ok) {
    throw new Error('Failed to translate text')
  }
  return response.json()
}

describe('API Client with MSW', () => {
  it('should fetch user data successfully', async () => {
    const user = await fetchUser()

    expect(user).toEqual({
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      nativeLanguage: 'en',
      targetLanguages: ['es', 'fr'],
      age: 25,
      country: 'US',
      timezone: 'America/New_York'
    })
  })

  it('should create a new user successfully', async () => {
    const userData = {
      email: 'newuser@example.com',
      fullName: 'New User'
    }

    const result = await createUser(userData)

    expect(result.success).toBe(true)
    expect(result.message).toBe('User created successfully')
    expect(result.user.email).toBe(userData.email)
    expect(result.user.fullName).toBe(userData.fullName)
  })

  it('should translate text successfully', async () => {
    const result = await translateText('Hello world', 'es')

    expect(result.translatedText).toBe('Translated: Hello world')
    expect(result.targetLang).toBe('es')
    expect(result.confidence).toBe(0.95)
  })

  it('should handle API errors correctly', async () => {
    const response = await fetch('/api/error')
    expect(response.status).toBe(500)
    expect(response.ok).toBe(false)

    const errorData = await response.json()
    expect(errorData.error).toBe('Internal server error')
  })

  it('should handle custom mock responses', async () => {
    // Override the default handler for this specific test
    server.use(
      http.get('/api/user', () => {
        return HttpResponse.json({
          id: '999',
          email: 'custom@example.com',
          fullName: 'Custom User',
          nativeLanguage: 'fr',
          targetLanguages: ['en'],
          age: 30,
          country: 'FR',
          timezone: 'Europe/Paris'
        })
      })
    )

    const user = await fetchUser()

    expect(user.id).toBe('999')
    expect(user.email).toBe('custom@example.com')
    expect(user.nativeLanguage).toBe('fr')
  })
})