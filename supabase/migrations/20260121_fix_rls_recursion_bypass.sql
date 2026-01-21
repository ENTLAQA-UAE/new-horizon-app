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
-- VERIFICATION COMMENT
-- =====================================================================
-- After running this migration, verify the fix by:
-- 1. Login as an HR user (not super_admin)
-- 2. Go to Interviews > Scorecards
-- 3. Create a new scorecard template
-- 4. The creation should complete without timeout
--
-- If still timing out, check:
-- - SELECT * FROM pg_proc WHERE proname = 'has_role' to verify row_security setting
-- - Ensure the functions are owned by postgres (superuser)
-- =====================================================================
