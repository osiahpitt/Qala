'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthDebugPage() {
  const [email, setEmail] = useState('')
  const [signupResult, setSignupResult] = useState<any>(null)

  const handleTestSignup = async () => {
    if (!email) return

    try {
      const result = await supabase.auth.signUp({
        email,
        password: 'testpassword123',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: 'Test User',
          }
        }
      })

      setSignupResult(result)
      console.log('Signup result:', result)
    } catch (error) {
      console.error('Signup error:', error)
      setSignupResult({ error })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="test@example.com"
            />
          </div>

          <button
            onClick={handleTestSignup}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Test Signup
          </button>

          <div className="text-sm space-y-2">
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            <p><strong>Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
            <p><strong>Redirect URL:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'N/A'}</p>
          </div>

          {signupResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="font-medium mb-2">Signup Result:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(signupResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}