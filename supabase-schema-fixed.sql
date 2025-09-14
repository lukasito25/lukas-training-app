-- Lukas Training App Database Schema (Fixed version)
-- Run this SQL in your Supabase SQL editor

-- Create completed_sessions table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS completed_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'anonymous',
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_time TIME NOT NULL DEFAULT CURRENT_TIME,
  week INTEGER NOT NULL CHECK (week >= 1 AND week <= 12),
  phase TEXT NOT NULL CHECK (phase IN ('foundation', 'growth', 'intensity')),
  day_name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  nutrition JSONB NOT NULL DEFAULT '[]'::jsonb,
  exercises_completed INTEGER NOT NULL DEFAULT 0,
  total_exercises INTEGER NOT NULL DEFAULT 0,
  nutrition_completed INTEGER NOT NULL DEFAULT 0,
  total_nutrition INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'anonymous' UNIQUE,
  current_week INTEGER NOT NULL DEFAULT 1 CHECK (current_week >= 1 AND current_week <= 12),
  completed_exercises JSONB NOT NULL DEFAULT '{}'::jsonb,
  exercise_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  nutrition_goals JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_completed_sessions_user_id ON completed_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_sessions_date ON completed_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_completed_sessions_week ON completed_sessions(week);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Insert default user preferences (ignore if exists)
INSERT INTO user_preferences (user_id, current_week)
VALUES ('anonymous', 1)
ON CONFLICT (user_id) DO NOTHING;

-- Enable Row Level Security (RLS) - safe to run multiple times
ALTER TABLE completed_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON completed_sessions;
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON user_preferences;

-- Create new policies
CREATE POLICY "Allow all operations for anonymous users" ON completed_sessions
  FOR ALL USING (user_id = 'anonymous');

CREATE POLICY "Allow all operations for anonymous users" ON user_preferences
  FOR ALL USING (user_id = 'anonymous');

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_completed_sessions_updated_at ON completed_sessions;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;

-- Create triggers for automatic updated_at
CREATE TRIGGER update_completed_sessions_updated_at
  BEFORE UPDATE ON completed_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();