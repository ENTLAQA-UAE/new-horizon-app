-- External Integrations Migration
-- Adds support for Zoom, Microsoft Teams, and Outlook Calendar

-- Add Zoom and Teams meeting fields to interviews table
ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT,
ADD COLUMN IF NOT EXISTS zoom_join_url TEXT,
ADD COLUMN IF NOT EXISTS zoom_start_url TEXT,
ADD COLUMN IF NOT EXISTS zoom_password TEXT,
ADD COLUMN IF NOT EXISTS teams_meeting_id TEXT,
ADD COLUMN IF NOT EXISTS teams_join_url TEXT,
ADD COLUMN IF NOT EXISTS meeting_provider TEXT DEFAULT 'google_meet'; -- 'google_meet', 'zoom', 'teams', 'in_person', 'phone'

-- Create index for meeting lookups
CREATE INDEX IF NOT EXISTS idx_interviews_zoom_meeting_id ON interviews(zoom_meeting_id) WHERE zoom_meeting_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interviews_teams_meeting_id ON interviews(teams_meeting_id) WHERE teams_meeting_id IS NOT NULL;

-- Organization-level integration settings
CREATE TABLE IF NOT EXISTS org_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'zoom', 'microsoft', 'google'
  is_enabled BOOLEAN DEFAULT true,
  default_for_interviews BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}', -- Provider-specific settings
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, provider)
);

-- Create indexes for org_integrations
CREATE INDEX IF NOT EXISTS idx_org_integrations_org_id ON org_integrations(org_id);
CREATE INDEX IF NOT EXISTS idx_org_integrations_provider ON org_integrations(provider);

-- RLS policies for org_integrations
ALTER TABLE org_integrations ENABLE ROW LEVEL SECURITY;

-- Organization members can view their org's integrations
CREATE POLICY "Org members can view org integrations"
  ON org_integrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = org_integrations.org_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Only org admins can manage integrations
CREATE POLICY "Org admins can insert org integrations"
  ON org_integrations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = org_integrations.org_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can update org integrations"
  ON org_integrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = org_integrations.org_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete org integrations"
  ON org_integrations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = org_integrations.org_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Webhook events log for tracking integration events
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'zoom', 'microsoft'
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for webhook processing
CREATE INDEX IF NOT EXISTS idx_integration_webhooks_processed ON integration_webhooks(processed) WHERE NOT processed;
CREATE INDEX IF NOT EXISTS idx_integration_webhooks_provider ON integration_webhooks(provider);
CREATE INDEX IF NOT EXISTS idx_integration_webhooks_created_at ON integration_webhooks(created_at);

-- RLS for webhooks (service role only - no user access)
ALTER TABLE integration_webhooks ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE org_integrations IS 'Organization-level integration settings for video conferencing providers';
COMMENT ON TABLE integration_webhooks IS 'Log of webhook events from external integration providers';
COMMENT ON COLUMN interviews.meeting_provider IS 'Video meeting provider: google_meet, zoom, teams, in_person, phone';
COMMENT ON COLUMN interviews.zoom_meeting_id IS 'Zoom meeting ID for joining via Zoom API';
COMMENT ON COLUMN interviews.teams_meeting_id IS 'Microsoft Teams meeting ID';
