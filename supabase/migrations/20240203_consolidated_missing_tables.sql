-- =============================================
-- CONSOLIDATED MIGRATION: Missing Tables & Functions
-- Run this if you're seeing errors on pages like:
-- - Screening Questions
-- - Pipelines
-- - Requisitions
-- - Documents
-- =============================================

-- =============================================
-- 1. HELPER FUNCTIONS (Required by RLS policies)
-- =============================================

-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = _user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Create app_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM (
      'super_admin',
      'org_admin',
      'hr_manager',
      'recruiter',
      'hiring_manager',
      'interviewer'
    );
  END IF;
END $$;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 2. PIPELINES & STAGES
-- =============================================

CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_pipelines_org ON public.pipelines(org_id);

-- Pipeline Stages (if not exists - might conflict with existing pipeline_stages)
-- This creates a junction table for pipeline-specific stages
CREATE TABLE IF NOT EXISTS public.pipeline_stage_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(pipeline_id, stage_id)
);

-- =============================================
-- 3. SCREENING QUESTIONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.screening_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_ar TEXT,
  description TEXT,
  description_ar TEXT,
  question_type VARCHAR(50) NOT NULL DEFAULT 'text',
  options JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT true,
  min_value NUMERIC,
  max_value NUMERIC,
  min_length INTEGER,
  max_length INTEGER,
  is_knockout BOOLEAN DEFAULT false,
  knockout_value TEXT,
  scoring_weight INTEGER DEFAULT 0,
  ideal_answer TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screening_questions_org ON public.screening_questions(org_id);
CREATE INDEX IF NOT EXISTS idx_screening_questions_job ON public.screening_questions(job_id);

-- Screening Responses
CREATE TABLE IF NOT EXISTS public.screening_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.screening_questions(id) ON DELETE CASCADE,
  answer TEXT,
  answer_json JSONB,
  file_url TEXT,
  score INTEGER,
  is_knockout_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_screening_responses_application ON public.screening_responses(application_id);

-- =============================================
-- 4. JOB REQUISITIONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.job_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.job_locations(id) ON DELETE SET NULL,
  justification TEXT,
  job_type VARCHAR(50),
  positions_count INTEGER DEFAULT 1,
  salary_range_min NUMERIC,
  salary_range_max NUMERIC,
  salary_currency VARCHAR(3) DEFAULT 'SAR',
  status VARCHAR(50) DEFAULT 'draft',
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_requisitions_org ON public.job_requisitions(org_id);
CREATE INDEX IF NOT EXISTS idx_job_requisitions_status ON public.job_requisitions(status);

-- Requisition Approvals
CREATE TABLE IF NOT EXISTS public.requisition_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID NOT NULL REFERENCES public.job_requisitions(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approval_order INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  comments TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. DOCUMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  category VARCHAR(100),
  is_template BOOLEAN DEFAULT false,
  related_to_type VARCHAR(50),
  related_to_id UUID,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);

-- =============================================
-- 6. STAGE APPROVAL REQUESTS
-- =============================================

CREATE TABLE IF NOT EXISTS public.stage_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  to_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending',
  comments TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_approval_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view pipelines in their org" ON public.pipelines;
DROP POLICY IF EXISTS "HR and above can manage pipelines" ON public.pipelines;
DROP POLICY IF EXISTS "Users can view screening questions in their org" ON public.screening_questions;
DROP POLICY IF EXISTS "HR and above can manage screening questions" ON public.screening_questions;
DROP POLICY IF EXISTS "Users can view screening responses in their org" ON public.screening_responses;
DROP POLICY IF EXISTS "Users can view requisitions in their org" ON public.job_requisitions;
DROP POLICY IF EXISTS "Staff can create requisitions" ON public.job_requisitions;
DROP POLICY IF EXISTS "HR and above can manage requisitions" ON public.job_requisitions;
DROP POLICY IF EXISTS "Users can view documents in their org" ON public.documents;
DROP POLICY IF EXISTS "HR and above can manage documents" ON public.documents;

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

-- DOCUMENTS POLICIES
CREATE POLICY "Users can view documents in their org"
  ON public.documents FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "HR and above can manage documents"
  ON public.documents FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- STAGE APPROVAL REQUESTS POLICIES
CREATE POLICY "Users can view approval requests in their org"
  ON public.stage_approval_requests FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- =============================================
-- 8. TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS update_pipelines_updated_at ON public.pipelines;
CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON public.pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_screening_questions_updated_at ON public.screening_questions;
CREATE TRIGGER update_screening_questions_updated_at
  BEFORE UPDATE ON public.screening_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_screening_responses_updated_at ON public.screening_responses;
CREATE TRIGGER update_screening_responses_updated_at
  BEFORE UPDATE ON public.screening_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_requisitions_updated_at ON public.job_requisitions;
CREATE TRIGGER update_job_requisitions_updated_at
  BEFORE UPDATE ON public.job_requisitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- DONE!
-- =============================================
-- Run this migration in your Supabase SQL Editor
-- This will create all missing tables needed for:
-- - Screening Questions page
-- - Pipelines page
-- - Requisitions page
-- - Documents page
