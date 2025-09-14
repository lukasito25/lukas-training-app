-- Fix Supabase RLS Policies for Anonymous Users
-- Run this in your Supabase SQL Editor

-- Ensure RLS is enabled
ALTER TABLE completed_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON completed_sessions;
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON user_preferences;
DROP POLICY IF EXISTS "Enable all operations for anonymous user" ON completed_sessions;
DROP POLICY IF EXISTS "Enable all operations for anonymous user" ON user_preferences;
DROP POLICY IF EXISTS "Anonymous access" ON completed_sessions;
DROP POLICY IF EXISTS "Anonymous access" ON user_preferences;

-- Create new policies that allow all operations for the anonymous user
CREATE POLICY "Enable all for anonymous" ON completed_sessions
  FOR ALL USING (user_id = 'anonymous');

CREATE POLICY "Enable all for anonymous" ON user_preferences
  FOR ALL USING (user_id = 'anonymous');

-- Verify the policies exist
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('completed_sessions', 'user_preferences');