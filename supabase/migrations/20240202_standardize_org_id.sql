-- =============================================
-- Standardize Column Naming: organization_id -> org_id
-- =============================================
-- This migration renames organization_id to org_id in legacy tables
-- to ensure consistency across the entire database schema.

-- =============================================
-- 1. RENAME COLUMNS IN LEGACY TABLES
-- =============================================

-- hiring_stages table
ALTER TABLE IF EXISTS public.hiring_stages
  RENAME COLUMN organization_id TO org_id;

-- workflows table
ALTER TABLE IF EXISTS public.workflows
  RENAME COLUMN organization_id TO org_id;

-- workflow_executions - no org column, linked via workflow_id

-- documents table
ALTER TABLE IF EXISTS public.documents
  RENAME COLUMN organization_id TO org_id;

-- document_templates table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_templates'
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.document_templates RENAME COLUMN organization_id TO org_id;
  END IF;
END $$;

-- application_questions table
ALTER TABLE IF EXISTS public.application_questions
  RENAME COLUMN organization_id TO org_id;

-- job_types table
ALTER TABLE IF EXISTS public.job_types
  RENAME COLUMN organization_id TO org_id;

-- job_grades table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_grades'
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.job_grades RENAME COLUMN organization_id TO org_id;
  END IF;
END $$;

-- =============================================
-- 2. UPDATE INDEXES (recreate with new column name)
-- =============================================

-- hiring_stages
DROP INDEX IF EXISTS idx_hiring_stages_org;
CREATE INDEX IF NOT EXISTS idx_hiring_stages_org ON public.hiring_stages(org_id);

-- workflows
DROP INDEX IF EXISTS idx_workflows_org_id;
DROP INDEX IF EXISTS idx_workflows_active;
CREATE INDEX IF NOT EXISTS idx_workflows_org ON public.workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON public.workflows(org_id, is_active) WHERE is_active = true;

-- documents
DROP INDEX IF EXISTS idx_documents_org_id;
CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(org_id);

-- application_questions
DROP INDEX IF EXISTS idx_application_questions_org;
CREATE INDEX IF NOT EXISTS idx_application_questions_org ON public.application_questions(org_id);

-- job_types
DROP INDEX IF EXISTS idx_job_types_org;
CREATE INDEX IF NOT EXISTS idx_job_types_org ON public.job_types(org_id);

-- =============================================
-- 3. UPDATE RLS POLICIES
-- =============================================

-- Drop and recreate policies for hiring_stages
DROP POLICY IF EXISTS "Users can view hiring stages" ON public.hiring_stages;
DROP POLICY IF EXISTS "Org admins can manage hiring stages" ON public.hiring_stages;

CREATE POLICY "Users can view hiring stages in their org"
  ON public.hiring_stages FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage hiring stages"
  ON public.hiring_stages FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- Drop and recreate policies for workflows
DROP POLICY IF EXISTS "Org members can view workflows" ON public.workflows;
DROP POLICY IF EXISTS "Org admins can manage workflows" ON public.workflows;

CREATE POLICY "Users can view workflows in their org"
  ON public.workflows FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "HR and above can manage workflows"
  ON public.workflows FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- Drop and recreate policies for documents
DROP POLICY IF EXISTS "Org members can view documents" ON public.documents;
DROP POLICY IF EXISTS "Org members can manage documents" ON public.documents;

CREATE POLICY "Users can view documents in their org"
  ON public.documents FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Recruiters and above can manage documents"
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

-- Drop and recreate policies for application_questions
DROP POLICY IF EXISTS "Users can view application questions" ON public.application_questions;
DROP POLICY IF EXISTS "Org admins can manage application questions" ON public.application_questions;

CREATE POLICY "Users can view application questions in their org"
  ON public.application_questions FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage application questions"
  ON public.application_questions FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- Drop and recreate policies for job_types
DROP POLICY IF EXISTS "Users can view job types" ON public.job_types;
DROP POLICY IF EXISTS "Org admins can manage job types" ON public.job_types;

CREATE POLICY "Users can view job types in their org"
  ON public.job_types FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage job types"
  ON public.job_types FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- =============================================
-- 4. ADD is_default AND is_terminal TO hiring_stages IF MISSING
-- =============================================

ALTER TABLE IF EXISTS public.hiring_stages
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_terminal BOOLEAN DEFAULT false;

-- =============================================
-- 5. HELPER FUNCTION TO SEED DEFAULT HIRING STAGES
-- =============================================

CREATE OR REPLACE FUNCTION public.seed_default_hiring_stages(p_org_id UUID)
RETURNS void AS $$
BEGIN
  -- Only insert if no stages exist for this org
  IF NOT EXISTS (SELECT 1 FROM public.hiring_stages WHERE org_id = p_org_id) THEN
    INSERT INTO public.hiring_stages (org_id, name, name_ar, color, sort_order, is_default, is_terminal, is_active)
    VALUES
      (p_org_id, 'Applied', 'تم التقديم', '#6B7280', 1, true, false, true),
      (p_org_id, 'Screening', 'الفحص الأولي', '#3B82F6', 2, true, false, true),
      (p_org_id, 'Interview', 'المقابلة', '#8B5CF6', 3, true, false, true),
      (p_org_id, 'Offer', 'العرض الوظيفي', '#F59E0B', 4, true, false, true),
      (p_org_id, 'Hired', 'تم التوظيف', '#10B981', 5, true, true, true),
      (p_org_id, 'Rejected', 'مرفوض', '#EF4444', 6, true, true, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
