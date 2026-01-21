-- =====================================================================
-- FIX RLS RECURSION BY ENSURING HELPER FUNCTIONS BYPASS RLS
-- =====================================================================
--
-- PROBLEM: RLS helper functions (has_role, is_super_admin, has_hr_access)
-- query the user_roles table, which has RLS policies that call these
-- same functions, creating an INFINITE RECURSION loop that causes timeouts.
--
-- The "Super admins can manage all roles" policy on user_roles calls
-- is_super_admin(), which calls has_role(), which queries user_roles,
-- which triggers the policy again -> INFINITE LOOP
--
-- SOLUTION: Add "SET row_security = off" to all helper functions.
-- Combined with SECURITY DEFINER, this ensures the functions bypass
-- RLS entirely when querying tables, preventing recursion.
-- =====================================================================

-- =====================================================================
-- 1. FIX has_role() - Bypass RLS to prevent recursion
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role_code VARCHAR, _org_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role::text = _role_code
  )
$$;

-- Update the app_role enum signature to also bypass RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- =====================================================================
-- 2. FIX is_super_admin() - Bypass RLS
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'super_admin'::public.app_role
  )
$$;

-- =====================================================================
-- 3. FIX has_hr_access() - Bypass RLS
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_hr_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('super_admin'::public.app_role, 'org_admin'::public.app_role, 'hr_manager'::public.app_role)
  )
$$;

-- =====================================================================
-- 4. FIX get_user_org_id() - Bypass RLS (queries profiles table)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT org_id FROM public.profiles WHERE id = _user_id
$$;

-- =====================================================================
-- 5. FIX has_recruiter_access() - Bypass RLS
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_recruiter_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN (
      'super_admin'::public.app_role,
      'org_admin'::public.app_role,
      'hr_manager'::public.app_role,
      'recruiter'::public.app_role
    )
  )
$$;

-- =====================================================================
-- 6. FIX has_interviewer_access() - Bypass RLS
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_interviewer_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN (
      'super_admin'::public.app_role,
      'org_admin'::public.app_role,
      'hr_manager'::public.app_role,
      'recruiter'::public.app_role,
      'interviewer'::public.app_role,
      'hiring_manager'::public.app_role
    )
  )
$$;

-- =====================================================================
-- GRANT EXECUTE permissions
-- =====================================================================
GRANT EXECUTE ON FUNCTION public.has_role(UUID, VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_hr_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_recruiter_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_interviewer_access(UUID) TO authenticated;

-- =====================================================================
-- 7. NEW: has_org_access() - Check if user belongs to an organization
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_org_access(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
    AND org_id = _org_id
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_org_access(UUID, UUID) TO authenticated;

-- =====================================================================
-- 8. NEW: get_user_roles_list() - Get all roles for a user as array
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_user_roles_list(_user_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT COALESCE(
    ARRAY_AGG(role::text),
    '{}'::TEXT[]
  )
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_user_roles_list(UUID) TO authenticated;

-- =====================================================================
-- Also grant to anon for public routes that need org checking
-- =====================================================================
GRANT EXECUTE ON FUNCTION public.get_user_org_id(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO anon;

-- =====================================================================
-- ROLE ACCESS MATRIX (for reference):
-- =====================================================================
--
-- | Role            | ATS Core | Scorecards | Settings | Analytics |
-- |-----------------|----------|------------|----------|-----------|
-- | super_admin     | ALL      | ALL        | ALL      | ALL       |
-- | org_admin       | READ     | READ       | ALL      | ALL       |
-- | hr_manager      | ALL      | ALL        | READ     | READ      |
-- | recruiter       | ALL      | READ       | READ     | READ      |
-- | hiring_manager  | READ     | READ       | NO       | NO        |
-- | interviewer     | READ     | OWN        | NO       | NO        |
-- | employee        | SELF     | SELF       | NO       | NO        |
--
-- org_admin: Organization admin (settings, branding, team, integrations, analytics)
--            NOT responsible for hiring operations (jobs, candidates)
--
-- hr_manager: HR operations lead (full ATS access, scorecards, offers)
--
-- ATS Core = jobs, candidates, applications, interviews, offers
-- Scorecards = scorecard_templates, interview_scorecards, offer_templates
-- Settings = departments, locations, pipeline_stages, integrations, branding
-- =====================================================================

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================
-- Run these after migration to verify the fix:
--
-- -- Test all functions work without recursion/timeout
-- SELECT has_role('YOUR_USER_ID'::uuid, 'org_admin');
-- SELECT has_role('YOUR_USER_ID'::uuid, 'hr_manager');
-- SELECT is_super_admin('YOUR_USER_ID'::uuid);
-- SELECT has_hr_access('YOUR_USER_ID'::uuid);
-- SELECT has_recruiter_access('YOUR_USER_ID'::uuid);
-- SELECT get_user_org_id('YOUR_USER_ID'::uuid);
-- SELECT get_user_roles_list('YOUR_USER_ID'::uuid);
--
-- -- Verify row_security=off is set on functions
-- SELECT p.proname, p.prosecdef as security_definer, p.proconfig
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- AND p.proname IN ('has_role', 'is_super_admin', 'has_hr_access',
--                   'get_user_org_id', 'has_recruiter_access',
--                   'has_interviewer_access', 'get_user_roles_list');
-- =====================================================================
