-- =============================================
-- Standardize Column Naming: organization_id -> org_id
-- =============================================
-- This migration renames organization_id to org_id in legacy tables
-- to ensure consistency across the entire database schema.
-- Uses conditional checks to only alter tables/columns that exist.

-- =============================================
-- 1. RENAME COLUMNS IN LEGACY TABLES (CONDITIONAL)
-- =============================================

-- Helper function to safely rename columns
DO $$
BEGIN
  -- hiring_stages table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hiring_stages' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.hiring_stages RENAME COLUMN organization_id TO org_id;
  END IF;

  -- workflows table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.workflows RENAME COLUMN organization_id TO org_id;
  END IF;

  -- documents table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.documents RENAME COLUMN organization_id TO org_id;
  END IF;

  -- document_templates table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'document_templates' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.document_templates RENAME COLUMN organization_id TO org_id;
  END IF;

  -- application_questions table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'application_questions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.application_questions RENAME COLUMN organization_id TO org_id;
  END IF;

  -- job_types table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_types' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.job_types RENAME COLUMN organization_id TO org_id;
  END IF;

  -- job_grades table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_grades' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.job_grades RENAME COLUMN organization_id TO org_id;
  END IF;
END $$;

-- =============================================
-- 2. UPDATE INDEXES (recreate with new column name)
-- =============================================

-- Conditionally recreate indexes only if tables exist
DO $$
BEGIN
  -- hiring_stages indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hiring_stages') THEN
    DROP INDEX IF EXISTS idx_hiring_stages_org;
    CREATE INDEX IF NOT EXISTS idx_hiring_stages_org ON public.hiring_stages(org_id);
  END IF;

  -- workflows indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflows') THEN
    DROP INDEX IF EXISTS idx_workflows_org_id;
    DROP INDEX IF EXISTS idx_workflows_active;
    CREATE INDEX IF NOT EXISTS idx_workflows_org ON public.workflows(org_id);
    CREATE INDEX IF NOT EXISTS idx_workflows_active ON public.workflows(org_id, is_active) WHERE is_active = true;
  END IF;

  -- documents indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    DROP INDEX IF EXISTS idx_documents_org_id;
    CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(org_id);
  END IF;

  -- application_questions indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_questions') THEN
    DROP INDEX IF EXISTS idx_application_questions_org;
    CREATE INDEX IF NOT EXISTS idx_application_questions_org ON public.application_questions(org_id);
  END IF;

  -- job_types indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_types') THEN
    DROP INDEX IF EXISTS idx_job_types_org;
    CREATE INDEX IF NOT EXISTS idx_job_types_org ON public.job_types(org_id);
  END IF;
END $$;

-- =============================================
-- 3. UPDATE RLS POLICIES (CONDITIONAL)
-- =============================================

-- Note: RLS policy updates are only executed if the table exists
-- Using separate DO blocks for each table to handle errors gracefully

-- hiring_stages policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hiring_stages') THEN
    DROP POLICY IF EXISTS "Users can view hiring stages" ON public.hiring_stages;
    DROP POLICY IF EXISTS "Org admins can manage hiring stages" ON public.hiring_stages;
    DROP POLICY IF EXISTS "Users can view hiring stages in their org" ON public.hiring_stages;

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
  END IF;
END $$;

-- workflows policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflows') THEN
    DROP POLICY IF EXISTS "Org members can view workflows" ON public.workflows;
    DROP POLICY IF EXISTS "Org admins can manage workflows" ON public.workflows;
    DROP POLICY IF EXISTS "Users can view workflows in their org" ON public.workflows;
    DROP POLICY IF EXISTS "HR and above can manage workflows" ON public.workflows;

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
  END IF;
END $$;

-- documents policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    DROP POLICY IF EXISTS "Org members can view documents" ON public.documents;
    DROP POLICY IF EXISTS "Org members can manage documents" ON public.documents;
    DROP POLICY IF EXISTS "Users can view documents in their org" ON public.documents;
    DROP POLICY IF EXISTS "Recruiters and above can manage documents" ON public.documents;

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
  END IF;
END $$;

-- application_questions policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_questions') THEN
    DROP POLICY IF EXISTS "Users can view application questions" ON public.application_questions;
    DROP POLICY IF EXISTS "Org admins can manage application questions" ON public.application_questions;
    DROP POLICY IF EXISTS "Users can view application questions in their org" ON public.application_questions;

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
  END IF;
END $$;

-- job_types policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_types') THEN
    DROP POLICY IF EXISTS "Users can view job types" ON public.job_types;
    DROP POLICY IF EXISTS "Org admins can manage job types" ON public.job_types;
    DROP POLICY IF EXISTS "Users can view job types in their org" ON public.job_types;

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
  END IF;
END $$;

-- =============================================
-- 4. ADD is_default AND is_terminal TO hiring_stages IF MISSING
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hiring_stages') THEN
    ALTER TABLE public.hiring_stages
      ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_terminal BOOLEAN DEFAULT false;
  END IF;
END $$;

-- =============================================
-- 5. HELPER FUNCTION TO SEED DEFAULT HIRING STAGES
-- =============================================

-- This function will only work if hiring_stages table exists
CREATE OR REPLACE FUNCTION public.seed_default_hiring_stages(p_org_id UUID)
RETURNS void AS $$
BEGIN
  -- Check if table exists first
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hiring_stages') THEN
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
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
