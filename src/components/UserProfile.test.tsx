import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

// Sample React component that fetches user data
function UserProfile() {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch('/api/user')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch user')
        }
        return response.json()
      })
      .then(userData => {
        setUser(userData)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div role="status">Loading user data...</div>
  }

  if (error) {
    return <div role="alert">Error: {error}</div>
  }

  return (
    <div data-testid="user-profile">
      <h1>User Profile</h1>
      <p data-testid="user-name">{user?.fullName}</p>
      <p data-testid="user-email">{user?.email}</p>
      <p data-testid="user-language">
        Native: {user?.nativeLanguage}, Learning: {user?.targetLanguages.join(', ')}
      </p>
      <p data-testid="user-location">{user?.country} ({user?.timezone})</p>
    </div>
  )
}

describe('UserProfile Component with MSW', () => {
  it('should render user data successfully', async () => {
    render(<UserProfile />)

    // Initially shows loading state
    expect(screen.getByRole('status')).toHaveTextContent('Loading user data...')

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByTestId('user-profile')).toBeInTheDocument()
    })

    // Check that all user data is rendered correctly
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User')
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    expect(screen.getByTestId('user-language')).toHaveTextContent('Native: en, Learning: es, fr')
    expect(screen.getByTestId('user-location')).toHaveTextContent('US (America/New_York)')
  })

  it('should handle API errors gracefully', async () => {
    // Override the default handler to return an error
    server.use(
      http.get('/api/user', () => {
        return HttpResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      })
    )

    render(<UserProfile />)

    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error: Failed to fetch user')
    })

    // Ensure user profile is not rendered
    expect(screen.queryByTestId('user-profile')).not.toBeInTheDocument()
  })

  it('should render different user data with custom mock', async () => {
    // Override with different user data
    server.use(
      http.get('/api/user', () => {
        return HttpResponse.json({
          id: '2',
          email: 'jane@example.com',
          fullName: 'Jane Doe',
          nativeLanguage: 'es',
          targetLanguages: ['en'],
          age: 28,
          country: 'ES',
          timezone: 'Europe/Madrid'
        })
      })
    )

    render(<UserProfile />)

    await waitFor(() => {
      expect(screen.getByTestId('user-profile')).toBeInTheDocument()
    })

    expect(screen.getByTestId('user-name')).toHaveTextContent('Jane Doe')
    expect(screen.getByTestId('user-email')).toHaveTextContent('jane@example.com')
    expect(screen.getByTestId('user-language')).toHaveTextContent('Native: es, Learning: en')
    expect(screen.getByTestId('user-location')).toHaveTextContent('ES (Europe/Madrid)')
  })
})