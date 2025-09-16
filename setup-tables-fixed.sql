-- QALA Database Schema - Fixed Version
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
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

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration INTEGER,
  user1_rating INTEGER CHECK (user1_rating >= 1 AND user1_rating <= 5),
  user2_rating INTEGER CHECK (user2_rating >= 1 AND user2_rating <= 5),
  connection_quality JSONB,
  session_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vocabulary table
CREATE TABLE IF NOT EXISTS vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_lang VARCHAR(10) NOT NULL,
  target_lang VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
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

-- Matching queue table
CREATE TABLE IF NOT EXISTS matching_queue (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_matching ON users (native_language, target_languages, age, gender, is_banned) WHERE is_banned = false;
CREATE INDEX IF NOT EXISTS idx_users_country_timezone ON users (country, timezone);
CREATE INDEX IF NOT EXISTS idx_sessions_users ON sessions (user1_id, user2_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions (session_status, started_at) WHERE session_status = 'active';
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_session ON vocabulary (user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_languages ON vocabulary (source_lang, target_lang);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports (reported_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matching_queue_active ON matching_queue (target_language, native_language, entered_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can create sessions they participate in" ON sessions;
DROP POLICY IF EXISTS "Users can view their own vocabulary" ON vocabulary;
DROP POLICY IF EXISTS "Users can manage their own vocabulary" ON vocabulary;
DROP POLICY IF EXISTS "Users can view reports they created" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can manage their own queue entry" ON matching_queue;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (
    auth.uid()::text = user1_id::text OR auth.uid()::text = user2_id::text
  );

CREATE POLICY "Users can create sessions they participate in" ON sessions
  FOR INSERT WITH CHECK (
    auth.uid()::text = user1_id::text OR auth.uid()::text = user2_id::text
  );

CREATE POLICY "Users can view their own vocabulary" ON vocabulary
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own vocabulary" ON vocabulary
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view reports they created" ON reports
  FOR SELECT USING (auth.uid()::text = reporter_id::text);

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid()::text = reporter_id::text);

CREATE POLICY "Users can manage their own queue entry" ON matching_queue
  FOR ALL USING (auth.uid()::text = user_id::text);