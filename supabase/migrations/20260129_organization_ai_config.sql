-- =====================================================
-- PER-ORGANIZATION AI CONFIGURATION
-- =====================================================
-- Each organization configures their own AI provider credentials
-- Supports: Anthropic Claude, OpenAI, Google Gemini, Perplexity
-- NO platform-level AI credentials required

-- =====================================================
-- 1. ORGANIZATION AI CONFIGURATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- AI Provider type
  provider TEXT NOT NULL, -- 'anthropic', 'openai', 'gemini', 'perplexity'

  -- Status flags
  is_enabled BOOLEAN DEFAULT false,
  is_configured BOOLEAN DEFAULT false, -- Has credentials been entered
  is_verified BOOLEAN DEFAULT false, -- Has been tested successfully

  -- Encrypted credentials (stored as encrypted JSON)
  -- For Anthropic: { "api_key": "sk-ant-..." }
  -- For OpenAI: { "api_key": "sk-...", "organization_id": "org-..." }
  -- For Gemini: { "api_key": "..." }
  -- For Perplexity: { "api_key": "pplx-..." }
  credentials_encrypted TEXT,

  -- Provider-specific settings (non-sensitive)
  settings JSONB DEFAULT '{}'::jsonb,
  -- Example settings:
  -- {
  --   "model": "claude-sonnet-4-20250514",
  --   "temperature": 0.7,
  --   "max_tokens": 4096,
  --   "custom_instructions": "Always respond in professional HR tone..."
  -- }

  -- Default AI provider for the organization
  is_default_provider BOOLEAN DEFAULT false,

  -- Verification info
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  last_used_at TIMESTAMPTZ,

  -- Provider metadata (e.g., account info, usage stats)
  provider_metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Each org can only have one config per provider
  UNIQUE(org_id, provider)
);

-- =====================================================
-- 2. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_org_ai_config_org_id ON organization_ai_config(org_id);
CREATE INDEX IF NOT EXISTS idx_org_ai_config_provider ON organization_ai_config(provider);
CREATE INDEX IF NOT EXISTS idx_org_ai_config_enabled ON organization_ai_config(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_org_ai_config_default ON organization_ai_config(org_id, is_default_provider) WHERE is_default_provider = true;

-- =====================================================
-- 3. AI USAGE LOGS TABLE (for tracking and analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- AI request details
  provider TEXT NOT NULL, -- 'anthropic', 'openai', 'gemini', 'perplexity'
  model TEXT NOT NULL, -- e.g., 'claude-sonnet-4-20250514', 'gpt-4o'
  feature TEXT NOT NULL, -- 'job_description', 'cv_screening', 'ranking', etc.

  -- Usage metrics
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  latency_ms INTEGER, -- Response time in milliseconds

  -- Request context
  job_id UUID REFERENCES jobs(id),
  application_id UUID REFERENCES applications(id),
  candidate_id UUID REFERENCES candidates(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'error', 'rate_limited'
  error_message TEXT,
  error_code TEXT,

  -- User who triggered the request
  triggered_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for AI logs
CREATE INDEX IF NOT EXISTS idx_ai_logs_org_id ON organization_ai_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON organization_ai_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feature ON organization_ai_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_logs_status ON organization_ai_logs(status) WHERE status != 'success';
CREATE INDEX IF NOT EXISTS idx_ai_logs_job ON organization_ai_logs(job_id) WHERE job_id IS NOT NULL;

-- =====================================================
-- 4. CANDIDATE AI SCREENING RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS candidate_ai_screening (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Screening scores (0-100)
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  skills_match_score INTEGER CHECK (skills_match_score >= 0 AND skills_match_score <= 100),
  experience_score INTEGER CHECK (experience_score >= 0 AND experience_score <= 100),
  education_score INTEGER CHECK (education_score >= 0 AND education_score <= 100),

  -- Ranking within the job applicants
  rank_position INTEGER,
  total_applicants INTEGER,

  -- Detailed analysis
  screening_feedback TEXT, -- AI-generated feedback
  skill_gaps JSONB DEFAULT '[]'::jsonb, -- Array of missing skills
  strengths JSONB DEFAULT '[]'::jsonb, -- Array of candidate strengths
  concerns JSONB DEFAULT '[]'::jsonb, -- Array of potential concerns

  -- Recommendation
  recommendation TEXT, -- 'strong_match', 'good_match', 'potential_match', 'weak_match', 'not_recommended'
  recommendation_reason TEXT,

  -- Interview scorecard integration
  scorecard_included BOOLEAN DEFAULT false,
  scorecard_ids JSONB DEFAULT '[]'::jsonb, -- Array of scorecard IDs used
  post_interview_score INTEGER CHECK (post_interview_score >= 0 AND post_interview_score <= 100),
  post_interview_rank INTEGER,

  -- AI metadata
  ai_provider TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  screening_version INTEGER DEFAULT 1, -- Increment when re-screened

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  screened_by UUID REFERENCES auth.users(id),

  -- Ensure one screening per application (can be updated)
  UNIQUE(application_id)
);

-- Indexes for screening results
CREATE INDEX IF NOT EXISTS idx_ai_screening_org_id ON candidate_ai_screening(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_screening_job_id ON candidate_ai_screening(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_screening_application_id ON candidate_ai_screening(application_id);
CREATE INDEX IF NOT EXISTS idx_ai_screening_overall_score ON candidate_ai_screening(job_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_screening_rank ON candidate_ai_screening(job_id, rank_position);

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE organization_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_ai_screening ENABLE ROW LEVEL SECURITY;

-- AI Config: Org members can view
CREATE POLICY "Org members can view AI config"
  ON organization_ai_config FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- AI Config: Only org admins can insert
CREATE POLICY "Org admins can insert AI config"
  ON organization_ai_config FOR INSERT
  TO authenticated
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- AI Config: Only org admins can update
CREATE POLICY "Org admins can update AI config"
  ON organization_ai_config FOR UPDATE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- AI Config: Only org admins can delete
CREATE POLICY "Org admins can delete AI config"
  ON organization_ai_config FOR DELETE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- AI Logs: Org members can view
CREATE POLICY "Org members can view AI logs"
  ON organization_ai_logs FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- AI Logs: Org members can insert (when using AI features)
CREATE POLICY "Org members can insert AI logs"
  ON organization_ai_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- AI Screening: Org members can view
CREATE POLICY "Org members can view AI screening"
  ON candidate_ai_screening FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- AI Screening: Org members can insert (recruiters, HR managers)
CREATE POLICY "Org members can insert AI screening"
  ON candidate_ai_screening FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- AI Screening: Org members can update (for re-screening)
CREATE POLICY "Org members can update AI screening"
  ON candidate_ai_screening FOR UPDATE
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to get org's default AI provider
CREATE OR REPLACE FUNCTION get_org_ai_provider(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider TEXT;
BEGIN
  SELECT provider INTO v_provider
  FROM organization_ai_config
  WHERE org_id = p_org_id
    AND is_enabled = true
    AND is_verified = true
    AND is_default_provider = true
  LIMIT 1;

  RETURN v_provider; -- Returns NULL if no AI configured
END;
$$;

-- Function to check if org has AI configured
CREATE OR REPLACE FUNCTION org_has_ai_configured(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_ai_config
    WHERE org_id = p_org_id
      AND is_enabled = true
      AND is_verified = true
  );
END;
$$;

-- Function to get AI config for a specific provider
CREATE OR REPLACE FUNCTION get_org_ai_config(p_org_id UUID, p_provider TEXT DEFAULT NULL)
RETURNS TABLE (
  provider TEXT,
  is_enabled BOOLEAN,
  is_verified BOOLEAN,
  settings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_provider IS NULL THEN
    -- Return default provider config
    RETURN QUERY
    SELECT
      oac.provider,
      oac.is_enabled,
      oac.is_verified,
      oac.settings
    FROM organization_ai_config oac
    WHERE oac.org_id = p_org_id
      AND oac.is_enabled = true
      AND oac.is_verified = true
      AND oac.is_default_provider = true
    LIMIT 1;
  ELSE
    -- Return specific provider config
    RETURN QUERY
    SELECT
      oac.provider,
      oac.is_enabled,
      oac.is_verified,
      oac.settings
    FROM organization_ai_config oac
    WHERE oac.org_id = p_org_id
      AND oac.provider = p_provider;
  END IF;
END;
$$;

-- =====================================================
-- 7. UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_ai_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_config_updated_at
  BEFORE UPDATE ON organization_ai_config
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_config_updated_at();

CREATE TRIGGER trigger_update_ai_screening_updated_at
  BEFORE UPDATE ON candidate_ai_screening
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_config_updated_at();

-- =====================================================
-- 8. COMMENTS
-- =====================================================
COMMENT ON TABLE organization_ai_config IS 'Stores per-organization AI provider credentials (encrypted) for Anthropic, OpenAI, Gemini, Perplexity';
COMMENT ON TABLE organization_ai_logs IS 'Log of all AI API calls made by each organization for tracking and analytics';
COMMENT ON TABLE candidate_ai_screening IS 'AI-generated screening results and rankings for job applicants';
COMMENT ON COLUMN organization_ai_config.credentials_encrypted IS 'AES-256 encrypted JSON containing API keys';
COMMENT ON COLUMN organization_ai_config.settings IS 'Non-sensitive provider settings like model, temperature, custom instructions';
COMMENT ON COLUMN candidate_ai_screening.skill_gaps IS 'JSON array of skills required by job but missing from candidate';
COMMENT ON COLUMN candidate_ai_screening.screening_version IS 'Incremented each time candidate is re-screened';
