import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  isProtectedRoute,
  isAuthRoute,
  hasCompletedProfile,
  canAccessRoute,
  authMiddleware,
  PROFILE_SETUP_ROUTE,
  LOGIN_ROUTE,
} from './middleware'

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({
      type: 'next',
      cookies: {
        set: vi.fn(),
      },
    })),
    redirect: vi.fn((url) => ({
      type: 'redirect',
      url: typeof url === 'string' ? url : url.toString()
    })),
  },
}))

// Mock Supabase SSR client
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
    },
  })),
}))

// Mock user objects
const mockCompleteUser = {
  id: 'user-123',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {
    full_name: 'Test User',
    native_language: 'en',
    target_languages: ['es', 'fr'],
    age: 25,
    country: 'USA',
    timezone: 'America/New_York',
  },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
}

const mockIncompleteUser = {
  id: 'user-456',
  email: 'incomplete@example.com',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {
    full_name: 'Incomplete User',
    // Missing required fields
  },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
}

const mockUnverifiedUser = {
  id: 'user-789',
  email: 'unverified@example.com',
  email_confirmed_at: null,
  app_metadata: {},
  user_metadata: {
    full_name: 'Unverified User',
    native_language: 'en',
    target_languages: ['es'],
    age: 25,
    country: 'USA',
    timezone: 'America/New_York',
  },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
}

// Helper function to create mock NextRequest
function createMockRequest(pathname: string, searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL(pathname, 'https://example.com')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return {
    nextUrl: url,
    url: url.href,
    cookies: {
      getAll: vi.fn(() => []),
      set: vi.fn(),
    },
  } as unknown as NextRequest
}

describe('middleware utilities', () => {
  describe('isProtectedRoute', () => {
    it('should identify protected routes correctly', () => {
      expect(isProtectedRoute('/dashboard')).toBe(true)
      expect(isProtectedRoute('/profile/edit')).toBe(true)
      expect(isProtectedRoute('/matching/queue')).toBe(true)
      expect(isProtectedRoute('/session/123')).toBe(true)
      expect(isProtectedRoute('/chat')).toBe(true)
      expect(isProtectedRoute('/settings')).toBe(true)
    })

    it('should identify non-protected routes correctly', () => {
      expect(isProtectedRoute('/')).toBe(false)
      expect(isProtectedRoute('/auth/login')).toBe(false)
      expect(isProtectedRoute('/auth/signup')).toBe(false)
      expect(isProtectedRoute('/about')).toBe(false)
      expect(isProtectedRoute('/privacy')).toBe(false)
    })
  })

  describe('isAuthRoute', () => {
    it('should identify auth routes correctly', () => {
      expect(isAuthRoute('/auth/login')).toBe(true)
      expect(isAuthRoute('/auth/signup')).toBe(true)
      expect(isAuthRoute('/auth/forgot-password')).toBe(true)
      expect(isAuthRoute('/auth/reset-password')).toBe(true)
      expect(isAuthRoute('/auth/verify-email')).toBe(true)
    })

    it('should identify non-auth routes correctly', () => {
      expect(isAuthRoute('/')).toBe(false)
      expect(isAuthRoute('/dashboard')).toBe(false)
      expect(isAuthRoute('/profile')).toBe(false)
      expect(isAuthRoute('/about')).toBe(false)
    })
  })

  describe('hasCompletedProfile', () => {
    it('should return true for complete profiles', () => {
      expect(hasCompletedProfile(mockCompleteUser)).toBe(true)
    })

    it('should return false for incomplete profiles', () => {
      expect(hasCompletedProfile(mockIncompleteUser)).toBe(false)
    })

    it('should return false for null/undefined users', () => {
      expect(hasCompletedProfile(null)).toBe(false)
      expect(hasCompletedProfile(null)).toBe(false)
    })

    it('should return false for users without user_metadata', () => {
      const userWithoutMetadata = {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z',
      }
      expect(hasCompletedProfile(userWithoutMetadata)).toBe(false)
    })

    it('should require all mandatory fields', () => {
      const requiredFields = [
        'full_name',
        'native_language',
        'target_languages',
        'age',
        'country',
        'timezone',
      ]

      requiredFields.forEach(field => {
        const userMissingField = {
          ...mockCompleteUser,
          user_metadata: {
            ...mockCompleteUser.user_metadata,
            [field]: field === 'target_languages' ? [] : undefined,
          },
        }
        expect(hasCompletedProfile(userMissingField)).toBe(false)
      })
    })

    it('should require target_languages to be a non-empty array', () => {
      const userWithEmptyTargetLanguages = {
        ...mockCompleteUser,
        user_metadata: {
          ...mockCompleteUser.user_metadata,
          target_languages: [],
        },
      }
      expect(hasCompletedProfile(userWithEmptyTargetLanguages)).toBe(false)
    })
  })

  describe('canAccessRoute', () => {
    it('should allow access to public routes without authentication', () => {
      const result = canAccessRoute(null, '/')
      expect(result.canAccess).toBe(true)
      expect(result.redirectTo).toBeUndefined()
    })

    it('should deny access to protected routes without authentication', () => {
      const result = canAccessRoute(null, '/dashboard')
      expect(result.canAccess).toBe(false)
      expect(result.redirectTo).toBe(LOGIN_ROUTE)
    })

    it('should deny access if email verification is required but not completed', () => {
      const result = canAccessRoute(mockUnverifiedUser, '/dashboard', {
        requireEmailVerification: true,
      })
      expect(result.canAccess).toBe(false)
      expect(result.redirectTo).toBe('/auth/verify-email')
    })

    it('should allow access if email verification is not required', () => {
      const result = canAccessRoute(mockUnverifiedUser, '/dashboard', {
        requireEmailVerification: false,
        requireCompleteProfile: false,
      })
      expect(result.canAccess).toBe(true)
    })

    it('should deny access if complete profile is required but not completed', () => {
      const result = canAccessRoute(mockIncompleteUser, '/dashboard', {
        requireCompleteProfile: true,
      })
      expect(result.canAccess).toBe(false)
      expect(result.redirectTo).toBe(PROFILE_SETUP_ROUTE)
    })

    it('should allow access if complete profile is not required', () => {
      const result = canAccessRoute(mockIncompleteUser, '/dashboard', {
        requireCompleteProfile: false,
      })
      expect(result.canAccess).toBe(true)
    })

    it('should allow access for users with complete profiles', () => {
      const result = canAccessRoute(mockCompleteUser, '/dashboard')
      expect(result.canAccess).toBe(true)
      expect(result.redirectTo).toBeUndefined()
    })
  })
})

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('should skip middleware for static files and API routes', async () => {
    const staticPaths = [
      '/_next/static/css/app.css',
      '/api/auth/callback',
      '/favicon.ico',
      '/logo.png',
    ]

    for (const path of staticPaths) {
      const request = createMockRequest(path)
      const response = await authMiddleware(request)
      expect(response.type).toBe('next')
    }
  })

  it('should redirect unauthenticated users from protected routes', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const request = createMockRequest('/dashboard')
    const response = await authMiddleware(request)

    expect(response.type).toBe('redirect')
    expect(response.url).toContain('/auth/login')
    expect(response.url).toContain('redirectTo=%2Fdashboard')
  })

  it('should redirect authenticated users to profile setup if profile incomplete', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: mockIncompleteUser,
            },
          },
          error: null,
        }),
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const request = createMockRequest('/dashboard')
    const response = await authMiddleware(request)

    expect(response.type).toBe('redirect')
    expect(response.url).toContain('/profile/setup')
  })

  it('should redirect unverified users to verification page', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: mockUnverifiedUser,
            },
          },
          error: null,
        }),
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const request = createMockRequest('/dashboard')
    const response = await authMiddleware(request)

    expect(response.type).toBe('redirect')
    expect(response.url).toContain('/auth/verify-email')
  })

  it('should allow access for authenticated users with complete profiles', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: mockCompleteUser,
            },
          },
          error: null,
        }),
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const request = createMockRequest('/dashboard')
    const response = await authMiddleware(request)

    expect(response.type).toBe('next')
  })

  it('should redirect authenticated users away from auth pages', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: mockCompleteUser,
            },
          },
          error: null,
        }),
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const request = createMockRequest('/auth/login')
    const response = await authMiddleware(request)

    expect(response.type).toBe('redirect')
    expect(response.url).toContain('/dashboard')
  })

  it('should handle redirectTo parameter on auth pages', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: mockCompleteUser,
            },
          },
          error: null,
        }),
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const request = createMockRequest('/auth/login', { redirectTo: '/profile' })
    const response = await authMiddleware(request)

    expect(response.type).toBe('redirect')
    expect(response.url).toContain('/profile')
  })

  it('should handle profile setup route correctly', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: mockIncompleteUser,
            },
          },
          error: null,
        }),
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const request = createMockRequest('/profile/setup')
    const response = await authMiddleware(request)

    expect(response.type).toBe('next')
  })

  it('should redirect users with complete profiles away from profile setup', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: mockCompleteUser,
            },
          },
          error: null,
        }),
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const request = createMockRequest('/profile/setup')
    const response = await authMiddleware(request)

    expect(response.type).toBe('redirect')
    expect(response.url).toContain('/dashboard')
  })

  it('should handle errors gracefully', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockRejectedValue(new Error('Auth error')),
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const request = createMockRequest('/dashboard')
    const response = await authMiddleware(request)

    expect(response.type).toBe('next')
    expect(consoleSpy).toHaveBeenCalledWith('Middleware error:', expect.any(Error))

    consoleSpy.mockRestore()
  })
})