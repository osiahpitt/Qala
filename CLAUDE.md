# QALA - Language Exchange Platform

## Tech Stack

**Frontend:**

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Radix UI
- React Query
- Zod

**Backend:**

- Next.js API Routes
- Supabase (Database + Auth + Realtime)
- Self-hosted WebRTC (simple-peer + Socket.io)
- Stripe
- Free STUN + Xirsys TURN
- Resend

**Testing (TDD):**

- Vitest (unit/integration)
- @testing-library/react
- Playwright (E2E)
- MSW (API mocking)
- Supertest
- Coverage reporting

**Hosting:**

- Vercel
- Supabase Cloud
- Socket.io on Railway.app

**Monitoring:**

- PostHog
- Sentry
- Vercel Analytics

**Development:**

- ESLint + Prettier
- Husky
- GitHub Actions (CI/CD with test automation)

## Essential Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Run all tests
npm run test:coverage # Test with coverage report
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # TypeScript check
npm run e2e          # Playwright E2E tests
```

## Code Standards (Non-Negotiable)

- TypeScript strict mode enabled
- ESLint + Prettier enforced via pre-commit hooks
- Component-based architecture (single responsibility)
- Descriptive variable/function names (no abbreviations)
- Async/await over callbacks
- Error boundaries for all major components
- Centralized error handling and logging
- Environment variables for all secrets/configs
- **NO console.logs in production code**
- **NO backwards compatibility unless explicitly requested**
- Git commit convention: `type(scope): message`
- 80% test coverage minimum
- Self-documenting code preferred over comments
- **TDD: After every code block: lint → compile → write tests → run tests before next block**

## Database Schema (Core Tables)

```sql
users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  native_language VARCHAR(10) NOT NULL,
  target_languages VARCHAR(10)[] NOT NULL,
  proficiency_levels JSONB NOT NULL DEFAULT '{}',
  age INTEGER NOT NULL CHECK (age >= 16),
  gender VARCHAR(20),
  country VARCHAR(3) NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  subscription_tier VARCHAR(20) DEFAULT 'free',
  translation_quota_used INTEGER DEFAULT 0,
  quota_reset_date TIMESTAMP DEFAULT NOW(),
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for matching performance
CREATE INDEX idx_users_matching ON users (native_language, target_languages, age, gender, is_banned) WHERE is_banned = false;
CREATE INDEX idx_users_country_timezone ON users (country, timezone);

sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration INTEGER, -- seconds
  user1_rating INTEGER CHECK (user1_rating >= 1 AND user1_rating <= 5),
  user2_rating INTEGER CHECK (user2_rating >= 1 AND user2_rating <= 5),
  connection_quality JSONB, -- WebRTC stats
  session_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for session queries
CREATE INDEX idx_sessions_users ON sessions (user1_id, user2_id, started_at DESC);
CREATE INDEX idx_sessions_active ON sessions (session_status, started_at) WHERE session_status = 'active';

vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_lang VARCHAR(10) NOT NULL,
  target_lang VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for vocabulary retrieval
CREATE INDEX idx_vocabulary_user_session ON vocabulary (user_id, session_id);
CREATE INDEX idx_vocabulary_languages ON vocabulary (source_lang, target_lang);

reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  action_taken VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for moderation
CREATE INDEX idx_reports_status ON reports (status, created_at DESC);
CREATE INDEX idx_reports_reported_user ON reports (reported_id, created_at DESC);

-- Matching queue table for persistence
matching_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  native_language VARCHAR(10) NOT NULL,
  target_language VARCHAR(10) NOT NULL,
  preferred_age_min INTEGER,
  preferred_age_max INTEGER,
  preferred_gender VARCHAR(20),
  queue_position INTEGER,
  entered_at TIMESTAMP DEFAULT NOW(),
  last_ping TIMESTAMP DEFAULT NOW()
);

-- Indexes for matching algorithm
CREATE INDEX idx_matching_queue_active ON matching_queue (target_language, native_language, entered_at);
CREATE INDEX idx_matching_queue_cleanup ON matching_queue (last_ping) WHERE last_ping < NOW() - INTERVAL '5 minutes';
```

## Project Structure

```
/src
  /app              # Next.js App Router
  /components       # Reusable UI components
  /lib              # Utilities and configurations
  /hooks            # Custom React hooks
  /types            # TypeScript definitions
  /api              # API route handlers
/tests              # Test files
/public             # Static assets
```

## Performance Requirements

- Max connection time: <3 seconds
- Video quality: 720p minimum (480p fallback)
- Concurrent users: 10,000 (MVP target)
- Latency tolerance: <200ms
- Match success rate: >80% (no skip within 2 min)

## WebRTC Configuration

- **STUN Servers**: Multiple free servers (Google: stun:stun.l.google.com:19302, Mozilla: stun:stun.services.mozilla.com)
- **TURN Fallback**: Xirsys with usage monitoring ($0.0025/GB, auto-disable at $50/month limit)
- **Signaling**: Socket.io with Redis adapter for horizontal scaling
- **P2P Library**: simple-peer with TypeScript declarations (see /src/types/simple-peer.d.ts)
- **Media Constraints**:
  ```javascript
  {
    video: {
      width: { ideal: 1280, max: 1280 },
      height: { ideal: 720, max: 720 },
      frameRate: { ideal: 30, max: 30 }
    },
    audio: {
      sampleRate: { ideal: 48000 },
      echoCancellation: true,
      noiseSuppression: true
    }
  }
  ```
- **Connection Quality Monitoring**: RTCStats collection every 5 seconds
- **Bandwidth Estimation**: Automatic quality downgrade below 1Mbps
- **Connection Timeout**: 30 seconds for initial connection, 10 seconds for reconnection

## Security & Safety (Non-Negotiable)

### Authentication & Access Control

- **Email verification**: Required before profile creation (Resend + Supabase Auth)
- **Age verification**: Database constraint `CHECK (age >= 16)` + client-side validation
- **Rate limiting**: 5 login attempts per IP per minute, 1 match request per user per second
- **Session management**: JWT with 24-hour expiration, secure httpOnly cookies

### Data Protection

- **Chat encryption**: AES-256 encryption for all text messages using Supabase encryption
- **Video streams**: Not recorded or stored (P2P only, no server relay unless connection fails)
- **Data retention**: 30-day automatic deletion of chat logs (user-deletable immediately)
- **PII handling**: Minimal data collection, hashed email storage for duplicates

### Content Moderation

- **Report system**: Immediate blocking during reports, 24-hour review process
- **Auto-moderation**: Profanity filtering in chat, automatic session termination for abuse keywords
- **Manual review**: Video recording only triggered by user reports (consent required)
- **Appeal process**: 7-day appeal window with human review

### Compliance Implementation

- **GDPR**: Data export API, right-to-deletion endpoints, consent management
- **CCPA**: Data sale opt-out (N/A - no data sales), transparent data usage
- **Security headers**: CSP, HSTS, XSS protection, CSRF tokens on all forms
- **Environment security**: All secrets in environment variables, no hardcoded credentials

## Testing Requirements

- **Minimum 80% coverage**
- Vitest (unit/integration)
- @testing-library/react
- Playwright (E2E)
- MSW (API mocking)
- Supertest
- E2E for critical paths: signup -> match -> video call

## Environment Variables Required

```bash
# Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://... # For migrations

# Payment Processing
STRIPE_SECRET_KEY=sk_live_or_test_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_webhook_secret

# Email Service
RESEND_API_KEY=re_api_key

# WebRTC & Real-time
SOCKET_IO_SERVER_URL=https://your-signaling-server.railway.app
SOCKET_IO_AUTH_TOKEN=secure-socket-auth-token
XIRSYS_USERNAME=your-xirsys-username
XIRSYS_CREDENTIAL=your-xirsys-credential
TURN_SERVER_URL=turn:global.turn.xirsys.com:80
TURN_SERVER_USERNAME=generated-username
TURN_SERVER_CREDENTIAL=generated-credential

# Translation API
GOOGLE_TRANSLATE_API_KEY=your-google-api-key
TRANSLATION_QUOTA_LIMIT=15 # Free tier lookups per session

# Security & Monitoring
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com
SENTRY_DSN=https://sentry-dsn
POSTHOG_API_KEY=your-posthog-key

# Rate Limiting (Redis)
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Development
NODE_ENV=development|production
VERCEL_URL=your-vercel-deployment-url
```

## Matching Algorithm Logic

**Queue-Based Persistent Matching System**

### Primary Matching (0-15 seconds):

```javascript
// Exact language pair matching
const exactMatches = await findMatches({
  native_language: user.target_language,
  target_language: user.native_language,
  age: user.age ± 5,
  gender: user.preferred_gender || 'any',
  proficiency: user.preferred_proficiency || 'any'
});
```

### Fallback Sequence:

1. **15-30s**: Remove proficiency requirement
2. **30-45s**: Expand age range to ±10 years
3. **45-60s**: Remove gender preference
4. **60s+**: Language-only matching

### Queue Implementation:

- **Redis-based persistent queues** per language pair
- **Atomic matching operations** to prevent race conditions
- **Queue position tracking** with estimated wait times
- **Auto-cleanup** of abandoned connections (5-minute timeout)
- **Priority system**: Premium users get faster matching

### Connection Flow:

1. User enters queue → Generate queue position
2. Match found → Create WebRTC signaling room
3. Both users accept → Initiate P2P connection
4. Connection established → Remove from queue, create session record
5. Connection failed → Return both users to queue with higher priority

## MVP Features (Priority Order)

1. Netflix-style landing page
2. Email signup/verification
3. Profile setup (languages, age, gender, proficiency)
4. Real-time matching system
5. WebRTC video calls
6. In-call Google Translate/Wiktionary integration
7. Text chat sidebar
8. Post-call rating/reporting
9. Basic user blocking

## Browser Support

- Chrome, Firefox, Safari, Edge, Opera (latest versions)
- Mobile responsive (PWA)
- Desktop-first approach
- Dark mode support

## Deployment Pipeline

- GitHub Actions CI/CD
- Vercel preview deployments
- Feature flags via PostHog
- Blue-green deployment strategy
- Database migrations: Online, non-blocking
