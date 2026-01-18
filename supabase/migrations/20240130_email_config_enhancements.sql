-- =====================================================
-- SECTION 3: PER-ORGANIZATION EMAIL CONFIGURATION ENHANCEMENTS
-- =====================================================
-- This migration adds:
-- 1. IMAP configuration fields for email sync
-- 2. Domain verification fields (DKIM, SPF, DMARC)
-- 3. SendGrid/Mailgun specific fields
-- 4. Email tracking tables
-- 5. Synced emails table for IMAP

-- =====================================================
-- 1. ADD IMAP AND DOMAIN VERIFICATION FIELDS TO EMAIL CONFIG
-- =====================================================
DO $$
BEGIN
  -- IMAP Configuration Fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'imap_enabled') THEN
    ALTER TABLE organization_email_config ADD COLUMN imap_enabled BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'imap_host') THEN
    ALTER TABLE organization_email_config ADD COLUMN imap_host TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'imap_port') THEN
    ALTER TABLE organization_email_config ADD COLUMN imap_port INTEGER DEFAULT 993;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'imap_username') THEN
    ALTER TABLE organization_email_config ADD COLUMN imap_username TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'imap_password_encrypted') THEN
    ALTER TABLE organization_email_config ADD COLUMN imap_password_encrypted TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'imap_encryption') THEN
    ALTER TABLE organization_email_config ADD COLUMN imap_encryption TEXT DEFAULT 'ssl'; -- 'ssl', 'tls', 'none'
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'imap_mailbox') THEN
    ALTER TABLE organization_email_config ADD COLUMN imap_mailbox TEXT DEFAULT 'INBOX';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'imap_sync_interval_minutes') THEN
    ALTER TABLE organization_email_config ADD COLUMN imap_sync_interval_minutes INTEGER DEFAULT 15;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'imap_last_sync_at') THEN
    ALTER TABLE organization_email_config ADD COLUMN imap_last_sync_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'imap_last_uid') THEN
    ALTER TABLE organization_email_config ADD COLUMN imap_last_uid INTEGER DEFAULT 0;
  END IF;

  -- Domain Verification Fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'dkim_selector') THEN
    ALTER TABLE organization_email_config ADD COLUMN dkim_selector TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'dkim_public_key') THEN
    ALTER TABLE organization_email_config ADD COLUMN dkim_public_key TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'dkim_verified') THEN
    ALTER TABLE organization_email_config ADD COLUMN dkim_verified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'spf_record') THEN
    ALTER TABLE organization_email_config ADD COLUMN spf_record TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'spf_verified') THEN
    ALTER TABLE organization_email_config ADD COLUMN spf_verified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'dmarc_record') THEN
    ALTER TABLE organization_email_config ADD COLUMN dmarc_record TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'dmarc_verified') THEN
    ALTER TABLE organization_email_config ADD COLUMN dmarc_verified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'domain_verification_token') THEN
    ALTER TABLE organization_email_config ADD COLUMN domain_verification_token TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'domain_verified_at') THEN
    ALTER TABLE organization_email_config ADD COLUMN domain_verified_at TIMESTAMPTZ;
  END IF;

  -- SendGrid specific fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'sendgrid_api_key_encrypted') THEN
    ALTER TABLE organization_email_config ADD COLUMN sendgrid_api_key_encrypted TEXT;
  END IF;

  -- Mailgun specific fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'mailgun_api_key_encrypted') THEN
    ALTER TABLE organization_email_config ADD COLUMN mailgun_api_key_encrypted TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'mailgun_domain') THEN
    ALTER TABLE organization_email_config ADD COLUMN mailgun_domain TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_config' AND column_name = 'mailgun_region') THEN
    ALTER TABLE organization_email_config ADD COLUMN mailgun_region TEXT DEFAULT 'us'; -- 'us' or 'eu'
  END IF;
END $$;

-- =====================================================
-- 2. EMAIL TRACKING EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email_log_id UUID NOT NULL REFERENCES organization_email_logs(id) ON DELETE CASCADE,

  -- Event type
  event_type TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed'

  -- Event details
  event_data JSONB DEFAULT '{}',
  -- For clicks: { "url": "https://..." }
  -- For bounces: { "bounce_type": "hard", "reason": "..." }

  -- Tracking info
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'

  -- Link tracking
  link_url TEXT,
  link_index INTEGER,

  -- Timestamps
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tracking events
CREATE INDEX IF NOT EXISTS idx_tracking_events_org ON email_tracking_events(org_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_email_log ON email_tracking_events(email_log_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_type ON email_tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_occurred ON email_tracking_events(occurred_at);

-- =====================================================
-- 3. SYNCED EMAILS TABLE (for IMAP)
-- =====================================================
CREATE TABLE IF NOT EXISTS synced_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- IMAP identifiers
  message_id TEXT NOT NULL, -- Email Message-ID header
  imap_uid INTEGER NOT NULL,

  -- Email headers
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  subject TEXT,

  -- Email content
  body_text TEXT,
  body_html TEXT,

  -- Attachments (stored as JSON array of { name, type, size, url })
  attachments JSONB DEFAULT '[]',

  -- Thread info
  in_reply_to TEXT, -- Message-ID of parent email
  thread_id TEXT, -- Computed thread identifier

  -- Matching
  candidate_id UUID REFERENCES candidates(id),
  application_id UUID REFERENCES applications(id),
  matched_at TIMESTAMPTZ,
  match_confidence FLOAT, -- 0-1 confidence score

  -- Direction
  direction TEXT NOT NULL DEFAULT 'inbound', -- 'inbound' or 'outbound'

  -- Flags
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,

  -- Timestamps from email
  email_date TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  raw_headers JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint to prevent duplicates
  UNIQUE(org_id, message_id)
);

-- Indexes for synced emails
CREATE INDEX IF NOT EXISTS idx_synced_emails_org ON synced_emails(org_id);
CREATE INDEX IF NOT EXISTS idx_synced_emails_from ON synced_emails(from_email);
CREATE INDEX IF NOT EXISTS idx_synced_emails_to ON synced_emails(to_email);
CREATE INDEX IF NOT EXISTS idx_synced_emails_candidate ON synced_emails(candidate_id) WHERE candidate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_synced_emails_application ON synced_emails(application_id) WHERE application_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_synced_emails_thread ON synced_emails(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_synced_emails_date ON synced_emails(email_date);
CREATE INDEX IF NOT EXISTS idx_synced_emails_direction ON synced_emails(direction);

-- Full text search index for email content
CREATE INDEX IF NOT EXISTS idx_synced_emails_search ON synced_emails USING gin(to_tsvector('english', COALESCE(subject, '') || ' ' || COALESCE(body_text, '')));

-- =====================================================
-- 4. DOMAIN VERIFICATION RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_domain_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Domain info
  domain TEXT NOT NULL,

  -- Record type and details
  record_type TEXT NOT NULL, -- 'DKIM', 'SPF', 'DMARC', 'MX', 'TXT'
  record_name TEXT NOT NULL, -- e.g., 'jadarat._domainkey' for DKIM
  record_value TEXT NOT NULL, -- The value that should be set

  -- Verification status
  is_verified BOOLEAN DEFAULT false,
  last_checked_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  verification_error TEXT,

  -- Auto-generated or user-provided
  is_auto_generated BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One record per type per domain per org
  UNIQUE(org_id, domain, record_type, record_name)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_domain_records_org ON email_domain_records(org_id);
CREATE INDEX IF NOT EXISTS idx_domain_records_domain ON email_domain_records(domain);

-- =====================================================
-- 5. EMAIL BOUNCE TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_bounces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Email reference
  email_log_id UUID REFERENCES organization_email_logs(id) ON DELETE SET NULL,

  -- Bounce details
  email_address TEXT NOT NULL,
  bounce_type TEXT NOT NULL, -- 'hard', 'soft', 'complaint'
  bounce_subtype TEXT, -- 'general', 'no-email', 'suppressed', 'mailbox-full', etc.

  -- Diagnostic info
  diagnostic_code TEXT,
  action TEXT, -- 'failed', 'delayed'
  status_code TEXT, -- SMTP status code like '550'

  -- Provider info
  provider TEXT NOT NULL,
  provider_bounce_id TEXT,

  -- Timestamps
  bounced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bounces_org ON email_bounces(org_id);
CREATE INDEX IF NOT EXISTS idx_bounces_email ON email_bounces(email_address);
CREATE INDEX IF NOT EXISTS idx_bounces_type ON email_bounces(bounce_type);
CREATE INDEX IF NOT EXISTS idx_bounces_date ON email_bounces(bounced_at);

-- =====================================================
-- 6. EMAIL SUPPRESSION LIST (for bounces/unsubscribes)
-- =====================================================
CREATE TABLE IF NOT EXISTS email_suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Suppressed email
  email_address TEXT NOT NULL,

  -- Suppression reason
  reason TEXT NOT NULL, -- 'hard_bounce', 'soft_bounce', 'complaint', 'unsubscribe', 'manual'

  -- Source
  source_email_log_id UUID REFERENCES organization_email_logs(id) ON DELETE SET NULL,

  -- Reactivation
  is_active BOOLEAN DEFAULT true,
  reactivated_at TIMESTAMPTZ,
  reactivated_by UUID REFERENCES auth.users(id),

  -- Timestamps
  suppressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One entry per email per org
  UNIQUE(org_id, email_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppression_org ON email_suppression_list(org_id);
CREATE INDEX IF NOT EXISTS idx_suppression_email ON email_suppression_list(email_address);
CREATE INDEX IF NOT EXISTS idx_suppression_active ON email_suppression_list(org_id, is_active) WHERE is_active = true;

-- =====================================================
-- 7. UPDATE EMAIL LOGS FOR MORE TRACKING
-- =====================================================
DO $$
BEGIN
  -- Add tracking token for open/click tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_logs' AND column_name = 'tracking_token') THEN
    ALTER TABLE organization_email_logs ADD COLUMN tracking_token UUID DEFAULT gen_random_uuid();
  END IF;

  -- Add click count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_logs' AND column_name = 'open_count') THEN
    ALTER TABLE organization_email_logs ADD COLUMN open_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_logs' AND column_name = 'click_count') THEN
    ALTER TABLE organization_email_logs ADD COLUMN click_count INTEGER DEFAULT 0;
  END IF;

  -- Add bounce info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_logs' AND column_name = 'bounced_at') THEN
    ALTER TABLE organization_email_logs ADD COLUMN bounced_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_logs' AND column_name = 'bounce_type') THEN
    ALTER TABLE organization_email_logs ADD COLUMN bounce_type TEXT;
  END IF;

  -- Add HTML body for tracking pixel injection
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_email_logs' AND column_name = 'body_html') THEN
    ALTER TABLE organization_email_logs ADD COLUMN body_html TEXT;
  END IF;
END $$;

-- Index on tracking token
CREATE INDEX IF NOT EXISTS idx_email_logs_tracking ON organization_email_logs(tracking_token) WHERE tracking_token IS NOT NULL;

-- =====================================================
-- 8. ROW LEVEL SECURITY FOR NEW TABLES
-- =====================================================
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_domain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_bounces ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppression_list ENABLE ROW LEVEL SECURITY;

-- Tracking events: Org admins can view
CREATE POLICY "Org admins can view tracking events"
  ON email_tracking_events FOR SELECT
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- Tracking events: System can insert
CREATE POLICY "System can insert tracking events"
  ON email_tracking_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Synced emails: Org members can view
CREATE POLICY "Org members can view synced emails"
  ON synced_emails FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- Synced emails: System can insert/update
CREATE POLICY "System can insert synced emails"
  ON synced_emails FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "System can update synced emails"
  ON synced_emails FOR UPDATE
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- Domain records: Org admins can manage
CREATE POLICY "Org admins can view domain records"
  ON email_domain_records FOR SELECT
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Org admins can insert domain records"
  ON email_domain_records FOR INSERT
  TO authenticated
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Org admins can update domain records"
  ON email_domain_records FOR UPDATE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Org admins can delete domain records"
  ON email_domain_records FOR DELETE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- Bounces: Org admins can view
CREATE POLICY "Org admins can view bounces"
  ON email_bounces FOR SELECT
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- Bounces: System can insert
CREATE POLICY "System can insert bounces"
  ON email_bounces FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Suppression list: Org admins can manage
CREATE POLICY "Org admins can view suppression list"
  ON email_suppression_list FOR SELECT
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Org admins can insert suppression list"
  ON email_suppression_list FOR INSERT
  TO authenticated
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Org admins can update suppression list"
  ON email_suppression_list FOR UPDATE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to check if email is suppressed
CREATE OR REPLACE FUNCTION is_email_suppressed(p_org_id UUID, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_suppression_list
    WHERE org_id = p_org_id
      AND email_address = LOWER(p_email)
      AND is_active = true
  );
END;
$$;

-- Function to get email thread
CREATE OR REPLACE FUNCTION get_email_thread(p_thread_id TEXT)
RETURNS SETOF synced_emails
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM synced_emails
  WHERE thread_id = p_thread_id
  ORDER BY email_date ASC;
END;
$$;

-- Function to match email to candidate
CREATE OR REPLACE FUNCTION match_email_to_candidate(p_email_address TEXT, p_org_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_candidate_id UUID;
BEGIN
  -- Try to find candidate by email
  SELECT id INTO v_candidate_id
  FROM candidates
  WHERE org_id = p_org_id
    AND LOWER(email) = LOWER(p_email_address)
  LIMIT 1;

  RETURN v_candidate_id;
END;
$$;

-- =====================================================
-- 10. COMMENTS
-- =====================================================
COMMENT ON TABLE email_tracking_events IS 'Tracks email events: opens, clicks, bounces, etc.';
COMMENT ON TABLE synced_emails IS 'Emails synced via IMAP for candidate communication tracking';
COMMENT ON TABLE email_domain_records IS 'DNS records required for domain verification (DKIM, SPF, DMARC)';
COMMENT ON TABLE email_bounces IS 'Detailed bounce information for email deliverability';
COMMENT ON TABLE email_suppression_list IS 'Emails that should not receive messages (bounces, unsubscribes)';
