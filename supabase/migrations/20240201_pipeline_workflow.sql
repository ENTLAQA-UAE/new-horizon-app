-- =============================================
-- JADARAT ATS - Pipeline & Workflow System
-- Section 7: Custom Pipelines, Approvals, Screening
-- =============================================

-- =============================================
-- 7.1 CUSTOM PIPELINES
-- =============================================

-- 1. Pipelines Table (for reusable pipeline templates)
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Pipeline Info
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,

  -- Settings
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pipelines_org ON public.pipelines(org_id);
CREATE INDEX idx_pipelines_default ON public.pipelines(org_id, is_default) WHERE is_default = true;

-- 2. Update pipeline_stages to support more features
ALTER TABLE public.pipeline_stages
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS stage_type VARCHAR(50) DEFAULT 'standard',
  -- stage_type: applied, screening, interview, assessment, offer, hired, rejected
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approvers UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS auto_email_template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS auto_reject_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_reject_days INTEGER,
  ADD COLUMN IF NOT EXISTS sla_warning_days INTEGER,
  ADD COLUMN IF NOT EXISTS sla_critical_days INTEGER;

-- 3. Add pipeline_id to jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL;

-- =============================================
-- 7.3 STAGE APPROVALS
-- =============================================

-- 4. Stage Approval Requests Table
CREATE TABLE IF NOT EXISTS public.stage_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE CASCADE,

  -- Request Info
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ DEFAULT NOW(),

  -- Approval Details
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  responded_at TIMESTAMPTZ,
  comments TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stage_approval_requests_org ON public.stage_approval_requests(org_id);
CREATE INDEX idx_stage_approval_requests_application ON public.stage_approval_requests(application_id);
CREATE INDEX idx_stage_approval_requests_approver ON public.stage_approval_requests(approver_id, status);

-- =============================================
-- 7.5 SCREENING QUESTIONS
-- =============================================

-- 5. Screening Questions Table
CREATE TABLE IF NOT EXISTS public.screening_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE, -- NULL = org-wide template

  -- Question Info
  question TEXT NOT NULL,
  question_ar TEXT,
  description TEXT,
  description_ar TEXT,

  -- Question Type
  question_type VARCHAR(50) NOT NULL DEFAULT 'text',
  -- text, textarea, select, multiselect, boolean, number, date, file

  -- Options (for select/multiselect)
  options JSONB DEFAULT '[]',
  -- Structure: [{ value, label, label_ar, score? }]

  -- Validation
  is_required BOOLEAN DEFAULT true,
  min_value NUMERIC,
  max_value NUMERIC,
  min_length INTEGER,
  max_length INTEGER,

  -- Scoring & Knockout
  is_knockout BOOLEAN DEFAULT false,
  knockout_value TEXT, -- Value that causes auto-reject
  scoring_weight INTEGER DEFAULT 0, -- 0 = no scoring
  ideal_answer TEXT, -- For scoring

  -- Display
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_screening_questions_org ON public.screening_questions(org_id);
CREATE INDEX idx_screening_questions_job ON public.screening_questions(job_id);

-- 6. Screening Responses Table
CREATE TABLE IF NOT EXISTS public.screening_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.screening_questions(id) ON DELETE CASCADE,

  -- Response
  answer TEXT,
  answer_json JSONB, -- For multiselect or complex answers
  file_url TEXT, -- For file uploads

  -- Scoring
  score INTEGER,
  is_knockout_triggered BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(application_id, question_id)
);

CREATE INDEX idx_screening_responses_application ON public.screening_responses(application_id);

-- =============================================
-- 7.6 JOB REQUISITION APPROVAL
-- =============================================

-- 7. Job Requisitions Table
CREATE TABLE IF NOT EXISTS public.job_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Requisition Info
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.job_locations(id) ON DELETE SET NULL,

  -- Details
  justification TEXT,
  job_type VARCHAR(50),
  positions_count INTEGER DEFAULT 1,
  salary_range_min NUMERIC,
  salary_range_max NUMERIC,
  salary_currency VARCHAR(3) DEFAULT 'SAR',

  -- Approval
  status VARCHAR(50) DEFAULT 'draft',
  -- draft, pending_approval, approved, rejected, converted

  -- Linked Job (after approval)
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,

  -- Metadata
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_requisitions_org ON public.job_requisitions(org_id);
CREATE INDEX idx_job_requisitions_status ON public.job_requisitions(status);

-- 8. Requisition Approvals Table
CREATE TABLE IF NOT EXISTS public.requisition_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID NOT NULL REFERENCES public.job_requisitions(id) ON DELETE CASCADE,

  -- Approver
  approver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approval_order INTEGER NOT NULL DEFAULT 1,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, skipped

  -- Response
  responded_at TIMESTAMPTZ,
  comments TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_requisition_approvals_requisition ON public.requisition_approvals(requisition_id);
CREATE INDEX idx_requisition_approvals_approver ON public.requisition_approvals(approver_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_approvals ENABLE ROW LEVEL SECURITY;

-- PIPELINES POLICIES
CREATE POLICY "Users can view pipelines in their org"
  ON public.pipelines FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "HR and above can manage pipelines"
  ON public.pipelines FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- STAGE APPROVAL REQUESTS POLICIES
CREATE POLICY "Users can view approval requests in their org"
  ON public.stage_approval_requests FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can create approval requests"
  ON public.stage_approval_requests FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Approvers can update their requests"
  ON public.stage_approval_requests FOR UPDATE
  TO authenticated
  USING (approver_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- SCREENING QUESTIONS POLICIES
CREATE POLICY "Users can view screening questions in their org"
  ON public.screening_questions FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "HR and above can manage screening questions"
  ON public.screening_questions FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- SCREENING RESPONSES POLICIES
CREATE POLICY "Users can view screening responses in their org"
  ON public.screening_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id
      AND a.org_id = public.get_user_org_id(auth.uid())
    )
    OR public.is_super_admin(auth.uid())
  );

-- JOB REQUISITIONS POLICIES
CREATE POLICY "Users can view requisitions in their org"
  ON public.job_requisitions FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Staff can create requisitions"
  ON public.job_requisitions FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "HR and above can manage requisitions"
  ON public.job_requisitions FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager')
    ))
    OR requested_by = auth.uid()
    OR public.is_super_admin(auth.uid())
  );

-- REQUISITION APPROVALS POLICIES
CREATE POLICY "Users can view requisition approvals"
  ON public.requisition_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_requisitions r
      WHERE r.id = requisition_id
      AND r.org_id = public.get_user_org_id(auth.uid())
    )
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Approvers can update their approvals"
  ON public.requisition_approvals FOR UPDATE
  TO authenticated
  USING (approver_id = auth.uid());

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON public.pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stage_approval_requests_updated_at
  BEFORE UPDATE ON public.stage_approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_screening_questions_updated_at
  BEFORE UPDATE ON public.screening_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_screening_responses_updated_at
  BEFORE UPDATE ON public.screening_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_requisitions_updated_at
  BEFORE UPDATE ON public.job_requisitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requisition_approvals_updated_at
  BEFORE UPDATE ON public.requisition_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to create default pipeline for an organization
CREATE OR REPLACE FUNCTION public.create_default_pipeline(p_org_id UUID)
RETURNS UUID AS $$
DECLARE
  v_pipeline_id UUID;
BEGIN
  -- Create default pipeline
  INSERT INTO public.pipelines (org_id, name, name_ar, description, is_default)
  VALUES (
    p_org_id,
    'Standard Hiring Pipeline',
    'مسار التوظيف الافتراضي',
    'Default hiring pipeline with standard stages',
    true
  )
  RETURNING id INTO v_pipeline_id;

  -- Create default stages for this pipeline
  INSERT INTO public.pipeline_stages (org_id, pipeline_id, name, name_ar, stage_type, color, sort_order)
  VALUES
    (p_org_id, v_pipeline_id, 'Applied', 'تم التقديم', 'applied', '#6B7280', 1),
    (p_org_id, v_pipeline_id, 'Screening', 'الفرز الأولي', 'screening', '#3B82F6', 2),
    (p_org_id, v_pipeline_id, 'Phone Interview', 'مقابلة هاتفية', 'interview', '#8B5CF6', 3),
    (p_org_id, v_pipeline_id, 'Technical Interview', 'مقابلة تقنية', 'interview', '#8B5CF6', 4),
    (p_org_id, v_pipeline_id, 'Final Interview', 'المقابلة النهائية', 'interview', '#8B5CF6', 5),
    (p_org_id, v_pipeline_id, 'Offer', 'العرض الوظيفي', 'offer', '#F59E0B', 6),
    (p_org_id, v_pipeline_id, 'Hired', 'تم التوظيف', 'hired', '#10B981', 7);

  RETURN v_pipeline_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if stage transition is allowed
CREATE OR REPLACE FUNCTION public.check_stage_transition_allowed(
  p_application_id UUID,
  p_target_stage_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_stage RECORD;
  v_pending_approvals INTEGER;
BEGIN
  -- Get target stage info
  SELECT * INTO v_stage FROM public.pipeline_stages WHERE id = p_target_stage_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Stage not found');
  END IF;

  -- Check if approval is required
  IF v_stage.requires_approval THEN
    -- Check for pending approval requests
    SELECT COUNT(*) INTO v_pending_approvals
    FROM public.stage_approval_requests
    WHERE application_id = p_application_id
      AND stage_id = p_target_stage_id
      AND status = 'approved';

    IF v_pending_approvals = 0 THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Approval required',
        'requires_approval', true,
        'approvers', v_stage.approvers
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate screening score for an application
CREATE OR REPLACE FUNCTION public.calculate_screening_score(p_application_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_weight INTEGER := 0;
  v_weighted_score INTEGER := 0;
  v_response RECORD;
  v_knockout_triggered BOOLEAN := false;
BEGIN
  FOR v_response IN
    SELECT sr.*, sq.scoring_weight, sq.is_knockout
    FROM public.screening_responses sr
    JOIN public.screening_questions sq ON sq.id = sr.question_id
    WHERE sr.application_id = p_application_id
  LOOP
    IF v_response.is_knockout_triggered THEN
      v_knockout_triggered := true;
    END IF;

    IF v_response.scoring_weight > 0 AND v_response.score IS NOT NULL THEN
      v_total_weight := v_total_weight + v_response.scoring_weight;
      v_weighted_score := v_weighted_score + (v_response.score * v_response.scoring_weight);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'total_score', CASE WHEN v_total_weight > 0 THEN (v_weighted_score::DECIMAL / v_total_weight) ELSE NULL END,
    'knockout_triggered', v_knockout_triggered,
    'total_weight', v_total_weight
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-reject if knockout question triggered
CREATE OR REPLACE FUNCTION public.handle_knockout_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_knockout_triggered THEN
    -- Update application status to rejected
    UPDATE public.applications
    SET
      status = 'rejected',
      rejection_reason = 'Failed screening question (knockout)',
      rejected_at = NOW()
    WHERE id = NEW.application_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER handle_knockout_on_screening_response
  AFTER INSERT OR UPDATE OF is_knockout_triggered ON public.screening_responses
  FOR EACH ROW
  WHEN (NEW.is_knockout_triggered = true)
  EXECUTE FUNCTION public.handle_knockout_response();

-- Function to check requisition approval status
CREATE OR REPLACE FUNCTION public.check_requisition_approval_status(p_requisition_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_pending_count INTEGER;
  v_rejected_count INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO v_pending_count, v_rejected_count
  FROM public.requisition_approvals
  WHERE requisition_id = p_requisition_id;

  IF v_rejected_count > 0 THEN
    RETURN 'rejected';
  ELSIF v_pending_count = 0 THEN
    RETURN 'approved';
  ELSE
    RETURN 'pending';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update requisition status when approval changes
CREATE OR REPLACE FUNCTION public.update_requisition_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_approval_status VARCHAR;
BEGIN
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    v_approval_status := public.check_requisition_approval_status(NEW.requisition_id);

    IF v_approval_status = 'approved' THEN
      UPDATE public.job_requisitions SET status = 'approved' WHERE id = NEW.requisition_id;
    ELSIF v_approval_status = 'rejected' THEN
      UPDATE public.job_requisitions SET status = 'rejected' WHERE id = NEW.requisition_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_requisition_status_on_approval
  AFTER UPDATE ON public.requisition_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_requisition_on_approval();
