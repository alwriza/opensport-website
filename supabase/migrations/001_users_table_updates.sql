-- OpenSport v2.0 Migration 001: Users Table Updates
-- Run in Supabase SQL Editor

-- Add subscription and track columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS user_track TEXT CHECK (user_track IN ('player', 'individual')) DEFAULT 'player',
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT CHECK (subscription_tier IN ('free', 'premium', 'basic', 'pro')) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'none')) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS track_switch_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Index for fast subscription lookups
CREATE INDEX IF NOT EXISTS idx_users_user_track ON users(user_track);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- RLS: Users can read/update own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = clerk_id OR is_admin = true);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = clerk_id);

-- Admins can view all users
CREATE POLICY IF NOT EXISTS "Admins can view all users"
  ON users FOR SELECT
  USING (EXISTS (SELECT 1 FROM users u WHERE u.clerk_id = auth.uid()::text AND u.is_admin = true));
