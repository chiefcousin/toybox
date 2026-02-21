-- Migration: 003_user_roles
-- Creates the user_roles table for staff/partner access control

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'partner', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles (user_id);

-- Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Service role full access (API routes use service role)
CREATE POLICY "Service role full access on user_roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own role
CREATE POLICY "Users can read their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
