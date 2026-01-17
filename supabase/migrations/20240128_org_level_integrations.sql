-- =====================================================
-- PER-ORGANIZATION INTEGRATIONS
-- =====================================================
-- Each organization configures their own API credentials
-- for Zoom, Microsoft Teams, Google, and Email (Resend)
-- NO platform-level credentials required

-- =====================================================
-- 1. ORGANIZATION INTEGRATION CREDENTIALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Integration type
  provider TEXT NOT NULL, -- 'zoom', 'microsoft', 'google', 'resend'

  -- Status
  is_enabled BOOLEAN DEFAULT false,
  is_configured BOOLEAN DEFAULT false, -- Has credentials been entered
  is_verified BOOLEAN DEFAULT false, -- Has been tested successfully

  -- Encrypted credentials (stored as encrypted JSON)
  credentials_encrypted TEXT, -- Encrypted JSON containing API keys

  -- Provider-specific settings (non-sensitive)
  settings JSONB DEFAULT '{}',
  -- For Zoom: { "default_waiting_room": true, "auto_recording": "cloud" }
  -- For Email: { "from_name": "Company HR", "reply_to": "hr@company.com" }

  -- For video providers: set as default for interviews
  is_default_meeting_provider BOOLEAN DEFAULT false,

  -- Verification info
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  last_used_at TIMESTAMPTZ,

  -- Metadata from provider (e.g., connected account email)
  provider_metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Each org can only have one config per provider
  UNIQUE(org_id, provider)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_integrations_org_id ON organization_integrations(org_id);
CREATE INDEX IF NOT EXISTS idx_org_integrations_provider ON organization_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_org_integrations_enabled ON organization_integrations(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_org_integrations_default_meeting ON organization_integrations(org_id, is_default_meeting_provider) WHERE is_default_meeting_provider = true;

-- =====================================================
-- 2. EMAIL CONFIGURATION TABLE (More detailed for Resend)
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_email_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,

  -- Provider
  email_provider TEXT DEFAULT 'resend', -- 'resend', 'smtp', 'sendgrid', 'mailgun'

  -- Encrypted API Key
  api_key_encrypted TEXT,

  -- Sender Configuration
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  reply_to_email TEXT,

  -- SMTP Settings (if using SMTP instead of Resend)
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT,
  smtp_password_encrypted TEXT,
  smtp_encryption TEXT DEFAULT 'tls', -- 'tls', 'ssl', 'none'

  -- Email Settings
  track_opens BOOLEAN DEFAULT true,
  track_clicks BOOLEAN DEFAULT true,

  -- Domain verification (for Resend)
  domain TEXT,
  domain_verified BOOLEAN DEFAULT false,

  -- Status
  is_enabled BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_org_email_config_org_id ON organization_email_config(org_id);

-- =====================================================
-- 3. EMAIL LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Email details
  to_email TEXT NOT NULL,
  to_name TEXT,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'

  -- Provider response
  provider TEXT NOT NULL, -- 'resend', 'smtp'
  provider_message_id TEXT,
  provider_response JSONB,

  -- Error info
  error_message TEXT,
  error_code TEXT,

  -- Tracking
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Related entities
  candidate_id UUID REFERENCES candidates(id),
  application_id UUID REFERENCES applications(id),
  interview_id UUID REFERENCES interviews(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Indexes for email logs
CREATE INDEX IF NOT EXISTS idx_email_logs_org_id ON organization_email_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON organization_email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON organization_email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_candidate ON organization_email_logs(candidate_id) WHERE candidate_id IS NOT NULL;

-- =====================================================
-- 4. INTEGRATION WEBHOOK LOGS (Keep for tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS integration_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_org ON integration_webhook_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON integration_webhook_logs(processed) WHERE NOT processed;

-- =====================================================
-- 5. UPDATE INTERVIEWS TABLE (if not already done)
-- =====================================================
DO $$
BEGIN
  -- Add meeting provider columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'meeting_provider') THEN
    ALTER TABLE interviews ADD COLUMN meeting_provider TEXT DEFAULT 'google_meet';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'zoom_meeting_id') THEN
    ALTER TABLE interviews ADD COLUMN zoom_meeting_id TEXT;
    ALTER TABLE interviews ADD COLUMN zoom_join_url TEXT;
    ALTER TABLE interviews ADD COLUMN zoom_start_url TEXT;
    ALTER TABLE interviews ADD COLUMN zoom_password TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'teams_meeting_id') THEN
    ALTER TABLE interviews ADD COLUMN teams_meeting_id TEXT;
    ALTER TABLE interviews ADD COLUMN teams_join_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'google_meet_link') THEN
    ALTER TABLE interviews ADD COLUMN google_meet_link TEXT;
    ALTER TABLE interviews ADD COLUMN google_calendar_event_id TEXT;
  END IF;
END $$;

-- =====================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE organization_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_email_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Organization integrations: Org members can view
CREATE POLICY "Org members can view integrations"
  ON organization_integrations FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- Organization integrations: Only org admins can insert
CREATE POLICY "Org admins can insert integrations"
  ON organization_integrations FOR INSERT
  TO authenticated
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- Organization integrations: Only org admins can update
CREATE POLICY "Org admins can update integrations"
  ON organization_integrations FOR UPDATE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- Organization integrations: Only org admins can delete
CREATE POLICY "Org admins can delete integrations"
  ON organization_integrations FOR DELETE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- Email config: Org members can view
CREATE POLICY "Org members can view email config"
  ON organization_email_config FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- Email config: Only org admins can insert
CREATE POLICY "Org admins can insert email config"
  ON organization_email_config FOR INSERT
  TO authenticated
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- Email config: Only org admins can update
CREATE POLICY "Org admins can update email config"
  ON organization_email_config FOR UPDATE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- Email logs: Org members can view
CREATE POLICY "Org members can view email logs"
  ON organization_email_logs FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- Email logs: System can insert (via service role)
CREATE POLICY "System can insert email logs"
  ON organization_email_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- Webhook logs: Org admins can view
CREATE POLICY "Org admins can view webhook logs"
  ON integration_webhook_logs FOR SELECT
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to get org's active meeting provider
CREATE OR REPLACE FUNCTION get_org_meeting_provider(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider TEXT;
BEGIN
  SELECT provider INTO v_provider
  FROM organization_integrations
  WHERE org_id = p_org_id
    AND is_enabled = true
    AND is_verified = true
    AND is_default_meeting_provider = true
    AND provider IN ('zoom', 'microsoft', 'google')
  LIMIT 1;

  RETURN COALESCE(v_provider, 'google_meet');
END;
$$;

-- Function to check if org has email configured
CREATE OR REPLACE FUNCTION org_has_email_configured(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_email_config
    WHERE org_id = p_org_id
      AND is_enabled = true
      AND is_verified = true
  );
END;
$$;

-- =====================================================
-- 8. COMMENTS
-- =====================================================
COMMENT ON TABLE organization_integrations IS 'Stores per-organization API credentials for Zoom, Teams, Google (encrypted)';
COMMENT ON TABLE organization_email_config IS 'Per-organization email configuration (Resend API key, SMTP settings)';
COMMENT ON TABLE organization_email_logs IS 'Log of all emails sent by each organization';
COMMENT ON COLUMN organization_integrations.credentials_encrypted IS 'AES-256 encrypted JSON containing API keys';
