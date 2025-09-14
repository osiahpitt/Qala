# QALA Development Plan

## Overview

Complete step-by-step development plan for QALA language exchange platform. Follow TDD methodology: lint → compile → write tests → run tests after each code block.

## Phase 1: Project Foundation & Setup

### 1.1 Project Initialization

- [ ] Initialize Next.js 14 project with TypeScript and App Router
- [ ] Configure TailwindCSS with custom design system
- [ ] Install and configure Radix UI components
- [ ] Set up React Query for state management
- [ ] Install and configure Zod for validation
- [ ] Create basic project folder structure (/src/app, /components, /lib, /hooks, /types)

### 1.2 Development Environment

- [ ] Configure ESLint with strict TypeScript rules
- [ ] Set up Prettier for code formatting
- [ ] Install and configure Husky for pre-commit hooks
- [ ] Set up Vitest for unit/integration testing
- [ ] Configure @testing-library/react for component testing
- [ ] Install and configure Playwright for E2E testing
- [ ] Set up MSW for API mocking
- [ ] Configure test coverage reporting (80% minimum)

### 1.3 Database & Authentication Setup

- [ ] Create Supabase project and configure database
- [ ] Set up environment variables (.env.local, .env.example)
- [ ] Configure Supabase client with TypeScript
- [ ] Create database schema (users, sessions, vocabulary, reports tables)
- [ ] Set up Row Level Security (RLS) policies
- [ ] Configure Supabase Auth with email verification
- [ ] Test database connections and basic CRUD operations

## Phase 2: Authentication System

### 2.1 User Database Schema

- [ ] Create users table with all required fields
- [ ] Set up user profile validation with Zod schemas
- [ ] Create TypeScript types for user data
- [ ] Implement user CRUD operations
- [ ] Add age restriction validation (16+ only)
- [ ] Set up timezone and country detection

### 2.2 Authentication Flow

- [ ] Build signup form with email/password
- [ ] Implement email verification with Resend
- [ ] Create login/logout functionality
- [ ] Build password reset flow
- [ ] Add form validation and error handling
- [ ] Implement protected route middleware
- [ ] Create authentication context/hooks

### 2.3 User Profile Management

- [ ] Build profile setup form (languages, age, gender, proficiency)
- [ ] Create language selection components
- [ ] Implement proficiency level indicators
- [ ] Build profile editing functionality
- [ ] Add avatar upload capability
- [ ] Create profile validation logic

## Phase 3: Landing Page & UI Foundation

### 3.1 Landing Page

- [ ] Create Netflix-style hero section
- [ ] Build feature showcase components
- [ ] Add testimonials/social proof section
- [ ] Create call-to-action components
- [ ] Implement responsive design
- [ ] Add smooth scrolling and animations

### 3.2 UI System

- [ ] Create design tokens and theme configuration
- [ ] Build reusable component library
- [ ] Implement dark mode support
- [ ] Create loading states and error boundaries
- [ ] Build notification/toast system
- [ ] Ensure WCAG 2.1 Level AA compliance

### 3.3 Navigation & Layout

- [ ] Create main navigation component
- [ ] Build responsive sidebar/mobile menu
- [ ] Implement breadcrumb navigation
- [ ] Create footer with legal links
- [ ] Add user menu and profile dropdown

## Phase 4: Real-time Matching System

### 4.1 Socket.io Server Setup

- [ ] Deploy Socket.io server on Railway.app with Redis adapter for scaling
- [ ] Configure JWT authentication middleware for Socket.io connections
- [ ] Implement Redis-based room management for matching queues per language pair
- [ ] Add heartbeat monitoring and automatic reconnection with exponential backoff
- [ ] Set up rate limiting: 1 match request/second, 10 signaling messages/second per user
- [ ] Create server cluster support with sticky sessions for horizontal scaling

### 4.2 Matching Algorithm

- [ ] Create atomic Redis operations for queue management (ZADD, ZRANGE, ZPOP)
- [ ] Implement language pair matching with composite Redis keys (native:target)
- [ ] Build progressive fallback system: exact → -proficiency → ±age → -gender → language-only
- [ ] Create persistent matching_queue table with heartbeat cleanup (5-minute timeout)
- [ ] Add priority matching for premium users (separate Redis sorted sets)
- [ ] Implement connection failure recovery: return users to queue with higher priority
- [ ] Add queue position estimation and wait time calculation based on historical data

### 4.3 Matching Interface

- [ ] Create matching preference form
- [ ] Build real-time matching queue UI
- [ ] Add matching status indicators
- [ ] Implement match found notifications
- [ ] Create match acceptance/rejection flow
- [ ] Add estimated wait time display

## Phase 5: WebRTC Video Calling

### 5.1 WebRTC Foundation

- [ ] Install simple-peer with custom TypeScript declarations (/src/types/simple-peer.d.ts)
- [ ] Configure multiple STUN servers with automatic failover (Google, Mozilla, OpenTok)
- [ ] Implement Xirsys TURN with cost monitoring and $50/month auto-cutoff
- [ ] Create Socket.io signaling rooms with unique session IDs
- [ ] Add RTCStats collection every 5 seconds (bitrate, packet loss, latency)
- [ ] Implement adaptive bitrate: 720p → 480p → audio-only based on connection quality
- [ ] Add P2P connection timeout (30s initial, 10s reconnect) with fallback to new match

### 5.2 Video Call Interface

- [ ] Build video call UI layout
- [ ] Create video stream components
- [ ] Add audio/video controls (mute, camera toggle)
- [ ] Implement call timer display
- [ ] Create connection status indicators
- [ ] Add full-screen video mode

### 5.3 Call Management

- [ ] Implement call initiation flow
- [ ] Add call acceptance/rejection logic
- [ ] Create call ending functionality
- [ ] Handle connection failures and reconnection
- [ ] Add call quality feedback system
- [ ] Implement call recording consent (if needed for reports)

## Phase 6: In-Call Features

### 6.1 Text Chat System

- [ ] Create chat sidebar component
- [ ] Implement real-time messaging with Socket.io
- [ ] Add message encryption for privacy
- [ ] Create chat history with 30-day retention
- [ ] Add message status indicators (sent/delivered)
- [ ] Implement emoji and basic formatting support

### 6.2 Translation Integration

- [ ] Integrate Google Translate API
- [ ] Create translation interface widget
- [ ] Add Wiktionary dictionary lookups
- [ ] Implement usage limits for free tier (15 lookups/session)
- [ ] Create vocabulary saving functionality
- [ ] Add translation history for session

### 6.3 Session Management

- [ ] Create session database schema and operations
- [ ] Implement session duration tracking
- [ ] Add automatic session saving
- [ ] Create session statistics display
- [ ] Implement session recovery after disconnect

## Phase 7: Post-Call System

### 7.1 Rating & Feedback

- [ ] Create post-call rating interface
- [ ] Implement 5-star rating system
- [ ] Add feedback text input
- [ ] Store ratings in sessions table
- [ ] Create user rating aggregation
- [ ] Display average ratings on profiles

### 7.2 Vocabulary Management

- [ ] Create vocabulary table and CRUD operations
- [ ] Build vocabulary saving interface during calls
- [ ] Implement vocabulary review system (premium feature)
- [ ] Add vocabulary export functionality
- [ ] Create spaced repetition system for saved words
- [ ] Build vocabulary statistics dashboard

### 7.3 User Actions

- [ ] Implement "Don't show again" functionality
- [ ] Create user reporting system
- [ ] Add "Recommend user" feature
- [ ] Build user blocking mechanism
- [ ] Create report processing workflow
- [ ] Implement automated moderation triggers

## Phase 8: Payment & Subscription System

### 8.1 Stripe Integration

- [ ] Set up Stripe account and API keys
- [ ] Create subscription plans (Free Trial, Premium)
- [ ] Implement payment processing
- [ ] Build billing dashboard
- [ ] Add payment method management
- [ ] Create invoice generation system

### 8.2 Subscription Logic

- [ ] Implement 7-day free trial system
- [ ] Create freemium feature limitations
- [ ] Build premium feature access control
- [ ] Add usage tracking and limits
- [ ] Implement subscription renewal handling
- [ ] Create subscription cancellation flow

### 8.3 Billing Interface

- [ ] Create subscription management dashboard
- [ ] Build payment history display
- [ ] Add billing notifications
- [ ] Implement failed payment handling
- [ ] Create subscription upgrade/downgrade flows

## Phase 9: Security & Compliance

### 9.1 Security Measures

- [ ] Implement rate limiting on all endpoints
- [ ] Add CSRF protection
- [ ] Set up XSS protection
- [ ] Create input sanitization middleware
- [ ] Implement SQL injection prevention
- [ ] Add brute force protection for login

### 9.2 Privacy & Compliance

- [ ] Create GDPR compliance features
- [ ] Implement CCPA compliance
- [ ] Add data export functionality
- [ ] Create data deletion mechanisms
- [ ] Build privacy settings dashboard
- [ ] Implement consent management

### 9.3 Content Moderation

- [ ] Create automated content filtering
- [ ] Implement user reporting workflow
- [ ] Build admin moderation dashboard
- [ ] Add automated ban/suspension system
- [ ] Create appeal process
- [ ] Implement IP blocking capabilities

## Phase 10: Testing & Quality Assurance

### 10.1 Comprehensive Testing

- [ ] Write unit tests for all components (80% coverage)
- [ ] Create integration tests for user flows
- [ ] Build E2E tests for critical paths (signup → match → call)
- [ ] Implement load testing for concurrent users
- [ ] Add WebRTC connection testing
- [ ] Create database performance tests

### 10.2 Performance Optimization

- [ ] Optimize bundle size and loading times
- [ ] Implement code splitting and lazy loading
- [ ] Add image optimization and CDN
- [ ] Create database query optimization
- [ ] Implement caching strategies
- [ ] Add performance monitoring

### 10.3 Deployment & Monitoring

- [ ] Set up Vercel deployment pipeline
- [ ] Configure GitHub Actions CI/CD
- [ ] Implement blue-green deployment
- [ ] Set up error tracking with Sentry
- [ ] Add performance monitoring with PostHog
- [ ] Create health check endpoints
- [ ] Set up uptime monitoring

## Phase 11: Launch Preparation

### 11.1 Production Readiness

- [ ] Set up production environment variables
- [ ] Configure production database
- [ ] Implement backup and disaster recovery
- [ ] Create monitoring and alerting systems
- [ ] Set up log aggregation
- [ ] Perform security audit

### 11.2 Legal & Compliance

- [ ] Create Terms of Service
- [ ] Build Privacy Policy
- [ ] Add Cookie Policy
- [ ] Implement age verification (16+)
- [ ] Create Community Guidelines
- [ ] Add DMCA policy

### 11.3 Go-Live Checklist

- [ ] Final E2E testing in production environment
- [ ] Load testing with expected user volumes
- [ ] Verify all payment flows work correctly
- [ ] Test email delivery and verification
- [ ] Confirm WebRTC connections across regions
- [ ] Validate all security measures

## Success Criteria

- Max connection time: <3 seconds
- Video quality: 720p minimum (480p fallback)
- Match success rate: >80% (no skip within 2 min)
- 80% test coverage maintained
- Zero critical security vulnerabilities
- WCAG 2.1 Level AA compliance
- All user flows tested and functional

## Dependencies & Risks

- WebRTC browser compatibility
- TURN server costs scaling with users
- Email deliverability for verification
- Payment processing compliance
- Real-time matching performance at scale
- Database connection limits with Supabase
