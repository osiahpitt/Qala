import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock API endpoints
  http.get('/api/user', () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      nativeLanguage: 'en',
      targetLanguages: ['es', 'fr'],
      age: 25,
      country: 'US',
      timezone: 'America/New_York'
    })
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    const body = await request.json() as { email: string; fullName: string }

    return HttpResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: '123',
        email: body.email,
        fullName: body.fullName
      }
    }, { status: 201 })
  }),

  http.get('/api/matching/queue', () => {
    return HttpResponse.json({
      position: 3,
      estimatedWaitTime: 45,
      totalInQueue: 12
    })
  }),

  http.post('/api/sessions', async ({ request }) => {
    const body = await request.json() as { user1Id: string; user2Id: string }

    return HttpResponse.json({
      sessionId: 'session-123',
      status: 'active',
      startedAt: new Date().toISOString(),
      participants: [body.user1Id, body.user2Id]
    }, { status: 201 })
  }),

  // Mock translation endpoint
  http.post('/api/translate', async ({ request }) => {
    const body = await request.json() as { text: string; sourceLang?: string; targetLang: string }

    return HttpResponse.json({
      translatedText: `Translated: ${body.text}`,
      sourceLang: body.sourceLang || 'auto',
      targetLang: body.targetLang,
      confidence: 0.95
    })
  }),

  // Error responses for testing
  http.get('/api/error', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }),

  http.get('/api/not-found', () => {
    return HttpResponse.json(
      { error: 'Resource not found' },
      { status: 404 }
    )
  })
]