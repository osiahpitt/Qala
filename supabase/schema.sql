-- QALA Database Schema
-- This schema creates all the tables and indexes required for the QALA language exchange platform

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable row level security
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret-here';

-- Users table
CREATE TABLE users (
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
CREATE TABLE sessions (
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

-- Vocabulary table
CREATE TABLE vocabulary (
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
CREATE TABLE reports (
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

-- Matching queue table for persistence
CREATE TABLE matching_queue (
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
CREATE INDEX idx_users_matching ON users (native_language, target_languages, age, gender, is_banned) WHERE is_banned = false;
CREATE INDEX idx_users_country_timezone ON users (country, timezone);
CREATE INDEX idx_sessions_users ON sessions (user1_id, user2_id, started_at DESC);
CREATE INDEX idx_sessions_active ON sessions (session_status, started_at) WHERE session_status = 'active';
CREATE INDEX idx_vocabulary_user_session ON vocabulary (user_id, session_id);
CREATE INDEX idx_vocabulary_languages ON vocabulary (source_lang, target_lang);
CREATE INDEX idx_reports_status ON reports (status, created_at DESC);
CREATE INDEX idx_reports_reported_user ON reports (reported_id, created_at DESC);
CREATE INDEX idx_matching_queue_active ON matching_queue (target_language, native_language, entered_at);
CREATE INDEX idx_matching_queue_cleanup ON matching_queue (last_ping) WHERE last_ping < NOW() - INTERVAL '5 minutes';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_queue ENABLE ROW LEVEL SECURITY;

-- Users table RLS policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id::text);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id::text);

CREATE POLICY "Users can view other users' public info during sessions" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE (s.user1_id = users.id OR s.user2_id = users.id)
      AND (s.user1_id::text = auth.uid() OR s.user2_id::text = auth.uid())
      AND s.session_status = 'active'
    )
  );

-- Sessions table RLS policies
CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (
    auth.uid() = user1_id::text OR auth.uid() = user2_id::text
  );

CREATE POLICY "Users can update their own sessions" ON sessions
  FOR UPDATE USING (
    auth.uid() = user1_id::text OR auth.uid() = user2_id::text
  );

CREATE POLICY "Users can create sessions they participate in" ON sessions
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id::text OR auth.uid() = user2_id::text
  );

-- Vocabulary table RLS policies
CREATE POLICY "Users can view their own vocabulary" ON vocabulary
  FOR SELECT USING (auth.uid() = user_id::text);

CREATE POLICY "Users can create their own vocabulary" ON vocabulary
  FOR INSERT WITH CHECK (auth.uid() = user_id::text);

CREATE POLICY "Users can update their own vocabulary" ON vocabulary
  FOR UPDATE USING (auth.uid() = user_id::text);

CREATE POLICY "Users can delete their own vocabulary" ON vocabulary
  FOR DELETE USING (auth.uid() = user_id::text);

-- Reports table RLS policies
CREATE POLICY "Users can view reports they created" ON reports
  FOR SELECT USING (auth.uid() = reporter_id::text);

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id::text);

-- Matching queue table RLS policies
CREATE POLICY "Users can view their own queue entry" ON matching_queue
  FOR SELECT USING (auth.uid() = user_id::text);

CREATE POLICY "Users can create their own queue entry" ON matching_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id::text);

CREATE POLICY "Users can update their own queue entry" ON matching_queue
  FOR UPDATE USING (auth.uid() = user_id::text);

CREATE POLICY "Users can delete their own queue entry" ON matching_queue
  FOR DELETE USING (auth.uid() = user_id::text);

-- Function to clean up old matching queue entries
CREATE OR REPLACE FUNCTION cleanup_matching_queue()
RETURNS void AS $$
BEGIN
  DELETE FROM matching_queue
  WHERE last_ping < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-matching-queue', '*/5 * * * *', 'SELECT cleanup_matching_queue();');

-- Insert supported language codes (for reference)
COMMENT ON TABLE users IS 'Supported language codes: en, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, th, vi, nl, sv, no, da, fi, pl';

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;