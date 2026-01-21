-- =====================================================================
-- COMPREHENSIVE FIX FOR RLS HELPER FUNCTIONS
-- =====================================================================
-- This migration fixes compatibility issues between:
-- 1. Simple RBAC (user_roles.role enum)
-- 2. Complex RBAC (user_roles.role_id -> roles.id)
--
-- Issues Fixed:
-- - has_hr_access() referencing non-existent profiles.role column
-- - has_role() function signature conflicts
-- - is_super_admin() compatibility
-- - All role-checking functions now work with BOTH schemas
--
-- IMPORTANT: We use CREATE OR REPLACE to update functions without
-- breaking existing RLS policies that depend on them.
-- =====================================================================

-- =====================================================================
-- 1. FIX get_user_org_id() - Already correct, just ensure it exists
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = _user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_user_org_id(UUID) TO authenticated;

-- =====================================================================
-- 2. FIX has_role() - Keep ALL existing signatures, update implementations
-- =====================================================================

-- Update the VARCHAR signature (used by most existing policies)
-- This function checks BOTH RBAC systems for compatibility
-- Uses SECURITY DEFINER to bypass RLS and avoid recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role_code VARCHAR, _org_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_role BOOLEAN := false;
  v_has_role_column BOOLEAN := false;
  v_has_role_id_column BOOLEAN := false;
BEGIN
  -- First, check which columns exist to avoid runtime errors
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_roles'
    AND column_name = 'role'
  ) INTO v_has_role_column;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_roles'
    AND column_name = 'role_id'
  ) INTO v_has_role_id_column;

  -- Method 1: Check simple user_roles table with role enum
  IF v_has_role_column THEN
    BEGIN
      EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role::text = $2)'
      ) INTO v_has_role USING _user_id, _role_code;

      IF v_has_role THEN
        RETURN true;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore any errors, continue to next method
      NULL;
    END;
  END IF;

  -- Method 2: Check complex RBAC with role_id -> roles table
  IF v_has_role_id_column THEN
    BEGIN
      EXECUTE format(
        'SELECT EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON ur.role_id = r.id
          WHERE ur.user_id = $1
          AND r.code = $2
          AND r.is_active = true
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          AND ($3 IS NULL OR ur.org_id = $3)
        )'
      ) INTO v_has_role USING _user_id, _role_code, _org_id;

      IF v_has_role THEN
        RETURN true;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore any errors
      NULL;
    END;
  END IF;

  RETURN false;
EXCEPTION WHEN OTHERS THEN
  -- Catch any unexpected errors and return false
  RETURN false;
END;
$$;

-- Update the app_role enum signature (for type safety)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, _role::varchar, NULL)
$$;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- =====================================================================
-- 3. FIX is_super_admin() - Check all possible sources
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use the unified has_role function
  RETURN public.has_role(_user_id, 'super_admin'::varchar, NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;

-- =====================================================================
-- 4. FIX has_hr_access() - CRITICAL: Remove reference to profiles.role
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_hr_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for HR-level roles using unified has_role function
  IF public.has_role(_user_id, 'super_admin'::varchar, NULL) THEN
    RETURN true;
  END IF;

  IF public.has_role(_user_id, 'org_admin'::varchar, NULL) THEN
    RETURN true;
  END IF;

  IF public.has_role(_user_id, 'hr_manager'::varchar, NULL) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_hr_access(UUID) TO authenticated;

-- =====================================================================
-- 5. NEW: has_recruiter_access() - For recruiter-level operations
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_recruiter_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- HR access includes recruiter access
  IF public.has_hr_access(_user_id) THEN
    RETURN true;
  END IF;

  -- Check recruiter role
  IF public.has_role(_user_id, 'recruiter'::varchar, NULL) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_recruiter_access(UUID) TO authenticated;

-- =====================================================================
-- 6. NEW: has_interviewer_access() - For interviewer-level operations
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_interviewer_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recruiter access includes interviewer access
  IF public.has_recruiter_access(_user_id) THEN
    RETURN true;
  END IF;

  -- Check interviewer and hiring_manager roles
  IF public.has_role(_user_id, 'interviewer'::varchar, NULL) THEN
    RETURN true;
  END IF;

  IF public.has_role(_user_id, 'hiring_manager'::varchar, NULL) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_interviewer_access(UUID) TO authenticated;

-- =====================================================================
-- 7. NEW: get_user_roles_list() - Get all roles for a user as array
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_user_roles_list(_user_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roles TEXT[] := '{}';
  v_temp_roles TEXT[];
BEGIN
  -- Method 1: Get from simple user_roles table (role enum)
  BEGIN
    SELECT ARRAY_AGG(role::text)
    INTO v_temp_roles
    FROM public.user_roles
    WHERE user_id = _user_id;

    IF v_temp_roles IS NOT NULL THEN
      v_roles := v_roles || v_temp_roles;
    END IF;
  EXCEPTION WHEN undefined_column OR undefined_table THEN
    NULL;
  END;

  -- Method 2: Get from complex RBAC (role_id -> roles)
  BEGIN
    SELECT ARRAY_AGG(r.code)
    INTO v_temp_roles
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

    IF v_temp_roles IS NOT NULL THEN
      v_roles := v_roles || v_temp_roles;
    END IF;
  EXCEPTION WHEN undefined_column OR undefined_table THEN
    NULL;
  END;

  -- Remove duplicates
  SELECT ARRAY_AGG(DISTINCT elem) INTO v_roles FROM unnest(v_roles) AS elem;

  RETURN COALESCE(v_roles, '{}');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_roles_list(UUID) TO authenticated;

-- =====================================================================
-- 8. FIX SCORECARD_TEMPLATES RLS POLICIES
-- =====================================================================

-- Drop existing policies (use IF EXISTS to be safe)
DROP POLICY IF EXISTS "Users can view scorecard templates in their org" ON public.scorecard_templates;
DROP POLICY IF EXISTS "HR can create scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "HR can update scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "HR can delete scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "HR and above can manage scorecard templates" ON public.scorecard_templates;

-- Recreate with fixed functions
CREATE POLICY "Users can view scorecard templates in their org"
  ON public.scorecard_templates FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "HR can create scorecard templates"
  ON public.scorecard_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_hr_access(auth.uid()))
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "HR can update scorecard templates"
  ON public.scorecard_templates FOR UPDATE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_hr_access(auth.uid()))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_hr_access(auth.uid()))
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "HR can delete scorecard templates"
  ON public.scorecard_templates FOR DELETE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_hr_access(auth.uid()))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 9. FIX INTERVIEW_SCORECARDS RLS POLICIES (if they exist)
-- =====================================================================

DO $$
BEGIN
  -- Only run if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interview_scorecards' AND table_schema = 'public') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view interview scorecards in their org" ON public.interview_scorecards;
    DROP POLICY IF EXISTS "Interviewers can manage their own scorecards" ON public.interview_scorecards;

    -- Recreate policies
    EXECUTE '
      CREATE POLICY "Users can view interview scorecards in their org"
        ON public.interview_scorecards FOR SELECT
        TO authenticated
        USING (
          org_id = public.get_user_org_id(auth.uid())
          OR public.is_super_admin(auth.uid())
        )
    ';

    EXECUTE '
      CREATE POLICY "Interviewers can manage their own scorecards"
        ON public.interview_scorecards FOR ALL
        TO authenticated
        USING (
          (interviewer_id = auth.uid() AND org_id = public.get_user_org_id(auth.uid()))
          OR public.has_hr_access(auth.uid())
          OR public.is_super_admin(auth.uid())
        )
        WITH CHECK (
          (interviewer_id = auth.uid() AND org_id = public.get_user_org_id(auth.uid()))
          OR public.has_hr_access(auth.uid())
          OR public.is_super_admin(auth.uid())
        )
    ';
  END IF;
END $$;

-- =====================================================================
-- SUMMARY OF CHANGES:
-- 1. get_user_org_id() - Confirmed working
-- 2. has_role(UUID, VARCHAR, UUID) - Updated to check BOTH RBAC systems
-- 3. has_role(UUID, app_role) - Calls the VARCHAR version
-- 4. is_super_admin() - Uses unified has_role()
-- 5. has_hr_access() - FIXED: No longer references profiles.role
-- 6. has_recruiter_access() - NEW: For recruiter-level checks
-- 7. has_interviewer_access() - NEW: For interviewer-level checks
-- 8. get_user_roles_list() - NEW: Get all user roles as array
-- 9. Scorecard policies - Recreated with fixed functions
--
-- All existing policies continue to work because we used
-- CREATE OR REPLACE instead of DROP + CREATE.
-- =====================================================================
