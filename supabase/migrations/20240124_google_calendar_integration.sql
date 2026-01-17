-- Google Calendar Integration Migration
-- This migration adds support for storing OAuth tokens and calendar event references

-- User integrations table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google_calendar', 'microsoft_calendar', etc.
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(provider);

-- Add calendar event fields to interviews table
ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_event_link TEXT,
ADD COLUMN IF NOT EXISTS video_meeting_link TEXT;

-- RLS policies for user_integrations
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own integrations
CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON user_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE user_integrations IS 'Stores OAuth tokens for third-party integrations like Google Calendar';
COMMENT ON COLUMN user_integrations.provider IS 'Integration provider: google_calendar, microsoft_calendar, etc.';
COMMENT ON COLUMN user_integrations.access_token IS 'OAuth access token (encrypted at rest by Supabase)';
COMMENT ON COLUMN user_integrations.refresh_token IS 'OAuth refresh token for obtaining new access tokens';
COMMENT ON COLUMN user_integrations.expires_at IS 'When the access token expires';
COMMENT ON COLUMN user_integrations.metadata IS 'Additional provider-specific metadata';
