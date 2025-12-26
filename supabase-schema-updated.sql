-- Lukas Training App Database Schema (Updated for 6-mesocycle system)
-- Run this SQL in your Supabase SQL editor

-- First, let's drop the existing user_preferences table and recreate it with the correct structure
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS completed_sessions CASCADE;
DROP TABLE IF EXISTS body_measurements CASCADE;

-- Create user_preferences table with correct structure
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'anonymous' UNIQUE,
  meso INTEGER NOT NULL DEFAULT 1 CHECK (meso >= 1 AND meso <= 6),
  week INTEGER NOT NULL DEFAULT 1 CHECK (week >= 1 AND week <= 8),
  day TEXT NOT NULL DEFAULT 'push' CHECK (day IN ('push', 'active_recovery', 'pull', 'rest', 'legs', 'arms', 'full_rest')),
  done JSONB NOT NULL DEFAULT '{}'::jsonb,
  weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  done_warmup JSONB NOT NULL DEFAULT '{}'::jsonb,
  done_cool JSONB NOT NULL DEFAULT '{}'::jsonb,
  nutrition_done JSONB NOT NULL DEFAULT '{}'::jsonb,
  sleep_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  recovery_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create completed_sessions table
CREATE TABLE completed_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'anonymous',
  session_date TEXT,
  session_time TEXT,
  week INTEGER NOT NULL CHECK (week >= 1 AND week <= 8),
  phase TEXT NOT NULL,
  day_name TEXT NOT NULL CHECK (day_name IN ('push', 'active_recovery', 'pull', 'rest', 'legs', 'arms', 'full_rest')),
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  nutrition JSONB NOT NULL DEFAULT '[]'::jsonb,
  exercises_completed INTEGER NOT NULL DEFAULT 0,
  total_exercises INTEGER NOT NULL DEFAULT 0,
  nutrition_completed INTEGER NOT NULL DEFAULT 0,
  total_nutrition INTEGER NOT NULL DEFAULT 0,
  sleep_duration DECIMAL(4,2),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  recovery_activities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create body_measurements table
CREATE TABLE body_measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'anonymous',
  mesocycle INTEGER NOT NULL CHECK (mesocycle >= 1 AND mesocycle <= 6),
  measurement_type TEXT NOT NULL CHECK (measurement_type IN ('start', 'end')),
  arms DECIMAL(5,2) NOT NULL,
  chest DECIMAL(5,2) NOT NULL,
  shoulders DECIMAL(5,2) NOT NULL,
  traps DECIMAL(5,2) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_completed_sessions_user_id ON completed_sessions(user_id);
CREATE INDEX idx_completed_sessions_date ON completed_sessions(session_date);
CREATE INDEX idx_body_measurements_user_id ON body_measurements(user_id);
CREATE INDEX idx_body_measurements_mesocycle ON body_measurements(mesocycle);

-- Insert default user preferences
INSERT INTO user_preferences (user_id, meso, week, day)
VALUES ('anonymous', 1, 1, 'push')
ON CONFLICT (user_id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for anonymous users" ON user_preferences
  FOR ALL USING (user_id = 'anonymous');

CREATE POLICY "Allow all operations for anonymous users" ON completed_sessions
  FOR ALL USING (user_id = 'anonymous');

CREATE POLICY "Allow all operations for anonymous users" ON body_measurements
  FOR ALL USING (user_id = 'anonymous');

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_completed_sessions_updated_at
  BEFORE UPDATE ON completed_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_body_measurements_updated_at
  BEFORE UPDATE ON body_measurements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();