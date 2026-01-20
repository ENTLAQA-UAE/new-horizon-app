-- Fix vacancy settings tables (job_types, job_grades, locations)
-- 1. Rename locations.organization_id to org_id (was missed in standardization)
-- 2. Update RLS policies to allow hr_manager role

-- =============================================
-- 1. RENAME LOCATIONS COLUMN (if not already done)
-- =============================================

DO $$
BEGIN
  -- locations table - rename organization_id to org_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'locations' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.locations RENAME COLUMN organization_id TO org_id;
  END IF;
END $$;

-- Update locations index
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    DROP INDEX IF EXISTS idx_locations_org;
    CREATE INDEX IF NOT EXISTS idx_locations_org ON public.locations(org_id);
  END IF;
END $$;

-- =============================================
-- 2. UPDATE RLS POLICIES FOR ALL THREE TABLES
-- =============================================

-- job_types policies - allow hr_manager
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_types') THEN
    DROP POLICY IF EXISTS "Users can view their organization's job types" ON public.job_types;
    DROP POLICY IF EXISTS "Org admins can manage job types" ON public.job_types;
    DROP POLICY IF EXISTS "Users can view job types in their org" ON public.job_types;
    DROP POLICY IF EXISTS "HR can manage job types" ON public.job_types;

    CREATE POLICY "Users can view job types in their org"
      ON public.job_types FOR SELECT
      TO authenticated
      USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

    CREATE POLICY "HR can manage job types"
      ON public.job_types FOR ALL
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
  END IF;
END $$;

-- job_grades policies - allow hr_manager
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_grades') THEN
    DROP POLICY IF EXISTS "Users can view their organization's job grades" ON public.job_grades;
    DROP POLICY IF EXISTS "Org admins can manage job grades" ON public.job_grades;
    DROP POLICY IF EXISTS "Users can view job grades in their org" ON public.job_grades;
    DROP POLICY IF EXISTS "HR can manage job grades" ON public.job_grades;

    CREATE POLICY "Users can view job grades in their org"
      ON public.job_grades FOR SELECT
      TO authenticated
      USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

    CREATE POLICY "HR can manage job grades"
      ON public.job_grades FOR ALL
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
  END IF;
END $$;

-- locations policies - allow hr_manager
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    DROP POLICY IF EXISTS "Users can view their organization's locations" ON public.locations;
    DROP POLICY IF EXISTS "Org admins can manage locations" ON public.locations;
    DROP POLICY IF EXISTS "Users can view locations in their org" ON public.locations;
    DROP POLICY IF EXISTS "HR can manage locations" ON public.locations;

    CREATE POLICY "Users can view locations in their org"
      ON public.locations FOR SELECT
      TO authenticated
      USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

    CREATE POLICY "HR can manage locations"
      ON public.locations FOR ALL
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
  END IF;
END $$;
