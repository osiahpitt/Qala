# QALA Signaling Server

Real-time matching and WebRTC signaling server for QALA language exchange platform.

## Features

- **Real-time Matching**: Redis-based queue system with progressive fallback algorithm
- **WebRTC Signaling**: Socket.io-based peer-to-peer connection establishment
- **Authentication**: JWT token validation with Supabase integration
- **Rate Limiting**: Per-user event rate limiting and IP-based request limits
- **Horizontal Scaling**: Redis adapter support for multi-instance deployment
- **Health Monitoring**: Connection quality tracking and stale connection cleanup

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with Socket.io
- **Database**: Supabase (PostgreSQL)
- **Cache/Queue**: Redis/IORedis
- **Authentication**: JWT with Supabase Auth
- **Language**: TypeScript
- **Deployment**: Railway.app ready

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Run in development mode
npm run dev
```

### Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

## Environment Variables

See `.env.example` for all required environment variables:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server operations
- `REDIS_URL` - Redis connection string
- `PORT` - Server port (default: 3001)
- `ALLOWED_ORIGINS` - CORS allowed origins

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

## Socket.io Events

### Authentication
All socket connections require JWT authentication via `auth.token` or Authorization header.

### Matching Events

#### Client → Server
- `matching:join_queue` - Join matching queue with preferences
- `matching:leave_queue` - Leave current queue
- `matching:accept_match` - Accept a found match
- `matching:reject_match` - Reject a found match

#### Server → Client
- `matching:match_found` - Notification when match is found
- `matching:match_accepted` - When partner accepts the match

### WebRTC Signaling Events

#### Bidirectional
- `webrtc:offer` - SDP offer exchange
- `webrtc:answer` - SDP answer exchange
- `webrtc:ice_candidate` - ICE candidate exchange
- `webrtc:connection_ready` - Connection establishment confirmation

### Connection Events
- `heartbeat` - Connection keep-alive
- `disconnect` - Client disconnection

## Matching Algorithm

### Progressive Fallback System

1. **Exact Match (0-15s)**: Perfect language pair + preferences
2. **Relaxed Proficiency (15-30s)**: Remove proficiency requirement
3. **Expanded Age (30-45s)**: Wider age range (±5 years)
4. **Gender Neutral (45-60s)**: Remove gender preferences
5. **Language Only (60s+)**: Only language pair matching

### Queue Management

- **Redis Sorted Sets**: FIFO ordering with timestamp scores
- **Priority Queuing**: Recently rejected users get priority
- **Cleanup Tasks**: Automatic removal of stale connections (5-minute timeout)
- **Position Tracking**: Real-time queue position updates

## Deployment

### Railway.app

1. Create new Railway project
2. Connect GitHub repository
3. Set environment variables
4. Deploy from `server/` directory

### Environment Setup

Required services:
- **Redis**: For queue management and caching
- **Supabase**: For authentication and user data

## Development Scripts

```bash
npm run dev          # Development server with hot reload
npm run build        # TypeScript compilation
npm run start        # Production server
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # TypeScript type checking
npm run test         # Run tests
npm run test:coverage # Test with coverage
```

## Architecture

```
src/
├── index.ts           # Main server entry point
├── config/
│   └── server.ts      # Server configuration
├── middleware/
│   └── auth.ts        # Authentication middleware
├── services/
│   ├── RedisService.ts    # Redis queue management
│   └── MatchingService.ts # Matching algorithm logic
├── types/
│   ├── socket.ts      # Socket event definitions
│   └── matching.ts    # Matching type definitions
└── utils/
    └── logger.ts      # Winston logging setup
```

## Performance

- **Concurrent Users**: Designed for 10,000+ simultaneous connections
- **Match Time**: Average <30 seconds for popular language pairs
- **Memory Usage**: ~50MB base + ~1KB per connected user
- **CPU Usage**: <5% under normal load
- **Network**: WebSocket + HTTP fallback with compression

## Monitoring

### Health Metrics
- Connection count and status
- Queue lengths per language pair
- Match success rate
- Average wait times
- Error rates

### Logs
- Structured JSON logging with Winston
- Log rotation (5MB files, 5 file retention)
- Development console output
- Production file logging

## Security

- **Rate Limiting**: 100 requests/minute per IP
- **Authentication**: JWT validation on all socket connections
- **CORS**: Configurable allowed origins
- **Input Validation**: Zod schema validation
- **Connection Limits**: Per-user event rate limiting

## Contributing

1. Follow TypeScript strict mode
2. All features must have tests
3. Use conventional commit messages
4. Update documentation for new features
5. Ensure 80% test coverage

## License

Proprietary - QALA Language Exchange Platform