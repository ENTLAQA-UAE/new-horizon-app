-- =============================================
-- JADARAT ATS - Interview & Hiring Process
-- Section 6: Scorecards, Feedback, Offers
-- =============================================

-- =============================================
-- 6.1 INTERVIEW SCORECARDS
-- =============================================

-- 1. Scorecard Templates Table
CREATE TABLE IF NOT EXISTS public.scorecard_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Template Info
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,

  -- Template Type
  template_type VARCHAR(50) NOT NULL DEFAULT 'general', -- technical, behavioral, cultural, general, custom

  -- Criteria Configuration
  criteria JSONB NOT NULL DEFAULT '[]',
  -- Structure: [{ id, name, name_ar, description, weight, rating_scale }]

  -- Rating Scale Configuration
  rating_scale_type VARCHAR(20) DEFAULT '1-5', -- 1-5, 1-10, custom
  rating_scale_labels JSONB DEFAULT '{"1": "Poor", "2": "Below Average", "3": "Average", "4": "Good", "5": "Excellent"}',
  rating_scale_labels_ar JSONB DEFAULT '{"1": "ضعيف", "2": "أقل من المتوسط", "3": "متوسط", "4": "جيد", "5": "ممتاز"}',

  -- Settings
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  require_notes_per_criteria BOOLEAN DEFAULT false,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scorecard_templates_org ON public.scorecard_templates(org_id);
CREATE INDEX idx_scorecard_templates_type ON public.scorecard_templates(template_type);

-- 2. Interview Scorecards Table (Individual Interviewer Feedback)
CREATE TABLE IF NOT EXISTS public.interview_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.scorecard_templates(id) ON DELETE SET NULL,

  -- Interviewer
  interviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Scores
  criteria_scores JSONB NOT NULL DEFAULT '[]',
  -- Structure: [{ criteria_id, score, notes }]

  -- Overall Assessment
  overall_score DECIMAL(4,2),
  weighted_score DECIMAL(4,2),

  -- Recommendation
  recommendation VARCHAR(50) NOT NULL DEFAULT 'neutral',
  -- strong_yes, yes, neutral, no, strong_no

  -- Feedback
  strengths TEXT,
  strengths_ar TEXT,
  weaknesses TEXT,
  weaknesses_ar TEXT,
  additional_notes TEXT,
  additional_notes_ar TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, locked
  submitted_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(interview_id, interviewer_id)
);

CREATE INDEX idx_interview_scorecards_org ON public.interview_scorecards(org_id);
CREATE INDEX idx_interview_scorecards_interview ON public.interview_scorecards(interview_id);
CREATE INDEX idx_interview_scorecards_interviewer ON public.interview_scorecards(interviewer_id);

-- =============================================
-- 6.3 OFFER MANAGEMENT
-- =============================================

-- 3. Offer Templates Table
CREATE TABLE IF NOT EXISTS public.offer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Template Info
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,

  -- Template Content
  subject VARCHAR(500),
  subject_ar VARCHAR(500),
  body_html TEXT NOT NULL,
  body_html_ar TEXT,

  -- Merge Fields Available
  -- {{candidate_name}}, {{job_title}}, {{salary}}, {{start_date}}, {{benefits}}, etc.
  merge_fields JSONB DEFAULT '[]',

  -- Settings
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Approval Settings
  requires_approval BOOLEAN DEFAULT true,
  approval_chain JSONB DEFAULT '[]',
  -- Structure: [{ role, user_id, order }]

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offer_templates_org ON public.offer_templates(org_id);

-- 4. Offers Table
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.offer_templates(id) ON DELETE SET NULL,

  -- Offer Details
  job_title VARCHAR(255) NOT NULL,
  job_title_ar VARCHAR(255),
  department VARCHAR(255),
  location VARCHAR(255),

  -- Compensation
  salary_amount DECIMAL(12,2) NOT NULL,
  salary_currency VARCHAR(3) DEFAULT 'SAR',
  salary_period VARCHAR(20) DEFAULT 'monthly', -- hourly, monthly, yearly

  -- Bonus & Equity
  signing_bonus DECIMAL(12,2),
  annual_bonus_percentage DECIMAL(5,2),
  equity_shares INTEGER,
  equity_type VARCHAR(50), -- stock_options, rsu, etc.

  -- Benefits
  benefits JSONB DEFAULT '[]',
  -- Structure: [{ name, name_ar, description, value }]

  -- Dates
  start_date DATE NOT NULL,
  offer_expiry_date DATE,
  probation_period_months INTEGER DEFAULT 3,

  -- Employment Terms
  employment_type VARCHAR(50) DEFAULT 'full_time',
  work_hours_per_week INTEGER DEFAULT 40,
  remote_policy VARCHAR(50), -- onsite, hybrid, remote
  notice_period_days INTEGER DEFAULT 30,

  -- Offer Letter
  offer_letter_html TEXT,
  offer_letter_pdf_url TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'draft',
  -- draft, pending_approval, approved, sent, viewed, accepted, declined, withdrawn, expired, counter_offered

  -- Candidate Response
  candidate_response VARCHAR(50),
  candidate_response_at TIMESTAMPTZ,
  candidate_response_notes TEXT,
  decline_reason TEXT,

  -- Counter Offer
  counter_offer_details JSONB,
  counter_offer_at TIMESTAMPTZ,

  -- E-Signature
  signature_requested BOOLEAN DEFAULT false,
  signature_provider VARCHAR(50), -- docusign, hellosign, internal
  signature_document_id VARCHAR(255),
  signed_at TIMESTAMPTZ,
  signed_document_url TEXT,

  -- Tracking
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offers_org ON public.offers(org_id);
CREATE INDEX idx_offers_application ON public.offers(application_id);
CREATE INDEX idx_offers_status ON public.offers(status);

-- 5. Offer Approvals Table
CREATE TABLE IF NOT EXISTS public.offer_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,

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

CREATE INDEX idx_offer_approvals_offer ON public.offer_approvals(offer_id);
CREATE INDEX idx_offer_approvals_approver ON public.offer_approvals(approver_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.scorecard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_approvals ENABLE ROW LEVEL SECURITY;

-- SCORECARD TEMPLATES POLICIES
CREATE POLICY "Users can view scorecard templates in their org"
  ON public.scorecard_templates FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "HR and above can manage scorecard templates"
  ON public.scorecard_templates FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- INTERVIEW SCORECARDS POLICIES
CREATE POLICY "Users can view scorecards in their org"
  ON public.interview_scorecards FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Interviewers can manage their own scorecards"
  ON public.interview_scorecards FOR ALL
  TO authenticated
  USING (
    (interviewer_id = auth.uid() AND org_id = public.get_user_org_id(auth.uid()))
    OR (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (interviewer_id = auth.uid() AND org_id = public.get_user_org_id(auth.uid()))
    OR (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- OFFER TEMPLATES POLICIES
CREATE POLICY "Users can view offer templates in their org"
  ON public.offer_templates FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "HR and above can manage offer templates"
  ON public.offer_templates FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- OFFERS POLICIES
CREATE POLICY "Users can view offers in their org"
  ON public.offers FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Recruiters and above can manage offers"
  ON public.offers FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- OFFER APPROVALS POLICIES
CREATE POLICY "Users can view offer approvals for offers in their org"
  ON public.offer_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = offer_id
      AND (o.org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()))
    )
  );

CREATE POLICY "Approvers can update their approvals"
  ON public.offer_approvals FOR UPDATE
  TO authenticated
  USING (approver_id = auth.uid())
  WITH CHECK (approver_id = auth.uid());

CREATE POLICY "HR and above can manage offer approvals"
  ON public.offer_approvals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = offer_id
      AND o.org_id = public.get_user_org_id(auth.uid())
      AND (
        public.has_role(auth.uid(), 'org_admin') OR
        public.has_role(auth.uid(), 'hr_manager')
      )
    )
    OR public.is_super_admin(auth.uid())
  );

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_scorecard_templates_updated_at
  BEFORE UPDATE ON public.scorecard_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interview_scorecards_updated_at
  BEFORE UPDATE ON public.interview_scorecards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_templates_updated_at
  BEFORE UPDATE ON public.offer_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_approvals_updated_at
  BEFORE UPDATE ON public.offer_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DEFAULT SCORECARD TEMPLATES
-- =============================================

-- We'll create default templates when the first organization is created
-- or via a separate seed script

-- Function to create default scorecard templates for an organization
CREATE OR REPLACE FUNCTION public.create_default_scorecard_templates(p_org_id UUID)
RETURNS void AS $$
BEGIN
  -- Technical Interview Template
  INSERT INTO public.scorecard_templates (org_id, name, name_ar, template_type, description, is_default, criteria)
  VALUES (
    p_org_id,
    'Technical Interview',
    'المقابلة التقنية',
    'technical',
    'Standard technical interview scorecard for assessing technical skills and problem-solving abilities',
    true,
    '[
      {"id": "tech_knowledge", "name": "Technical Knowledge", "name_ar": "المعرفة التقنية", "description": "Understanding of relevant technologies and concepts", "weight": 25},
      {"id": "problem_solving", "name": "Problem Solving", "name_ar": "حل المشكلات", "description": "Ability to analyze and solve technical problems", "weight": 25},
      {"id": "code_quality", "name": "Code Quality", "name_ar": "جودة الكود", "description": "Writing clean, maintainable, and efficient code", "weight": 20},
      {"id": "system_design", "name": "System Design", "name_ar": "تصميم النظام", "description": "Ability to design scalable systems", "weight": 15},
      {"id": "communication", "name": "Technical Communication", "name_ar": "التواصل التقني", "description": "Explaining technical concepts clearly", "weight": 15}
    ]'::jsonb
  );

  -- Behavioral Interview Template
  INSERT INTO public.scorecard_templates (org_id, name, name_ar, template_type, description, criteria)
  VALUES (
    p_org_id,
    'Behavioral Interview',
    'المقابلة السلوكية',
    'behavioral',
    'Standard behavioral interview scorecard using STAR method',
    '[
      {"id": "leadership", "name": "Leadership", "name_ar": "القيادة", "description": "Demonstrates leadership qualities and initiative", "weight": 20},
      {"id": "teamwork", "name": "Teamwork", "name_ar": "العمل الجماعي", "description": "Collaborates effectively with others", "weight": 20},
      {"id": "adaptability", "name": "Adaptability", "name_ar": "التكيف", "description": "Handles change and ambiguity well", "weight": 20},
      {"id": "conflict_resolution", "name": "Conflict Resolution", "name_ar": "حل النزاعات", "description": "Manages disagreements constructively", "weight": 20},
      {"id": "motivation", "name": "Motivation & Drive", "name_ar": "الدافع والحماس", "description": "Shows enthusiasm and career motivation", "weight": 20}
    ]'::jsonb
  );

  -- Cultural Fit Interview Template
  INSERT INTO public.scorecard_templates (org_id, name, name_ar, template_type, description, criteria)
  VALUES (
    p_org_id,
    'Cultural Fit Interview',
    'مقابلة التوافق الثقافي',
    'cultural',
    'Assess alignment with company values and culture',
    '[
      {"id": "values_alignment", "name": "Values Alignment", "name_ar": "التوافق مع القيم", "description": "Alignment with company core values", "weight": 25},
      {"id": "work_style", "name": "Work Style", "name_ar": "أسلوب العمل", "description": "Compatible work style and preferences", "weight": 25},
      {"id": "growth_mindset", "name": "Growth Mindset", "name_ar": "عقلية النمو", "description": "Openness to learning and feedback", "weight": 25},
      {"id": "team_dynamics", "name": "Team Dynamics", "name_ar": "ديناميكيات الفريق", "description": "Likely to integrate well with the team", "weight": 25}
    ]'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Calculate weighted score for a scorecard
CREATE OR REPLACE FUNCTION public.calculate_scorecard_weighted_score(p_scorecard_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_weighted_score DECIMAL := 0;
  v_total_weight INTEGER := 0;
  v_criteria RECORD;
  v_template_criteria JSONB;
  v_scorecard_scores JSONB;
BEGIN
  -- Get template criteria and scorecard scores
  SELECT st.criteria, sc.criteria_scores
  INTO v_template_criteria, v_scorecard_scores
  FROM public.interview_scorecards sc
  LEFT JOIN public.scorecard_templates st ON st.id = sc.template_id
  WHERE sc.id = p_scorecard_id;

  -- Calculate weighted score
  FOR v_criteria IN SELECT * FROM jsonb_array_elements(v_template_criteria)
  LOOP
    DECLARE
      v_criteria_id TEXT := v_criteria.value->>'id';
      v_weight INTEGER := (v_criteria.value->>'weight')::INTEGER;
      v_score DECIMAL;
    BEGIN
      -- Find matching score
      SELECT (s.value->>'score')::DECIMAL INTO v_score
      FROM jsonb_array_elements(v_scorecard_scores) s
      WHERE s.value->>'criteria_id' = v_criteria_id;

      IF v_score IS NOT NULL THEN
        v_weighted_score := v_weighted_score + (v_score * v_weight);
        v_total_weight := v_total_weight + v_weight;
      END IF;
    END;
  END LOOP;

  -- Return weighted average
  IF v_total_weight > 0 THEN
    RETURN v_weighted_score / v_total_weight;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update weighted score on scorecard change
CREATE OR REPLACE FUNCTION public.update_scorecard_weighted_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.weighted_score := public.calculate_scorecard_weighted_score(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: We can't create this trigger until after the first insert
-- CREATE TRIGGER calculate_weighted_score_on_update
--   BEFORE UPDATE OF criteria_scores ON public.interview_scorecards
--   FOR EACH ROW EXECUTE FUNCTION public.update_scorecard_weighted_score();

-- Function to check if all approvals are complete for an offer
CREATE OR REPLACE FUNCTION public.check_offer_approval_status(p_offer_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_pending_count INTEGER;
  v_rejected_count INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO v_pending_count, v_rejected_count
  FROM public.offer_approvals
  WHERE offer_id = p_offer_id;

  IF v_rejected_count > 0 THEN
    RETURN 'rejected';
  ELSIF v_pending_count = 0 THEN
    RETURN 'approved';
  ELSE
    RETURN 'pending';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update offer status when approval changes
CREATE OR REPLACE FUNCTION public.update_offer_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_approval_status VARCHAR;
BEGIN
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    v_approval_status := public.check_offer_approval_status(NEW.offer_id);

    IF v_approval_status = 'approved' THEN
      UPDATE public.offers SET status = 'approved' WHERE id = NEW.offer_id AND status = 'pending_approval';
    ELSIF v_approval_status = 'rejected' THEN
      UPDATE public.offers SET status = 'draft' WHERE id = NEW.offer_id; -- Back to draft for revision
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_offer_status_on_approval
  AFTER UPDATE ON public.offer_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_offer_on_approval();
