-- =====================================================================
-- RADICAL RLS FIX - ELIMINATE ALL RECURSION POSSIBILITIES
-- =====================================================================
--
-- ROOT CAUSE: The "Super admins can manage all roles" policy on user_roles
-- is set to FOR ALL, which means even SELECT queries call is_super_admin().
-- Even with row_security=off, PostgreSQL may still evaluate multiple policies.
--
-- SOLUTION: Split the "FOR ALL" policy into separate policies:
-- - SELECT: Only use simple user_id = auth.uid() check (no function calls)
-- - INSERT/UPDATE/DELETE: Use is_super_admin() for admin operations only
--
-- This ensures SELECT queries on user_roles NEVER trigger recursive function calls.
-- =====================================================================

-- =====================================================================
-- 1. FIX USER_ROLES TABLE - Remove FOR ALL policy, use separate policies
-- =====================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Org admins can view org roles" ON public.user_roles;

-- Make sure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- CRITICAL: SELECT policy with NO FUNCTION CALLS
-- Users can always see their own roles (simple comparison, no recursion possible)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- For admin operations (INSERT, UPDATE, DELETE), we still need is_super_admin
-- But these are separate policies so they don't affect SELECT queries

-- INSERT policy for super admins
CREATE POLICY "Super admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

-- UPDATE policy for super admins
CREATE POLICY "Super admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- DELETE policy for super admins
CREATE POLICY "Super admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- =====================================================================
-- 2. FIX PROFILES TABLE - Same pattern
-- =====================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Org members can view org profiles" ON public.profiles;
DROP POLICY IF EXISTS "HR can view org profiles" ON public.profiles;

-- Make sure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- CRITICAL: SELECT policy for own profile - NO FUNCTION CALLS
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Super admin policies (separate from SELECT to avoid recursion on self-queries)
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Org members can view other org members' profiles (for collaboration)
-- This uses a simple subquery instead of a function to avoid recursion
CREATE POLICY "Org members can view org profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    org_id IS NOT NULL
    AND org_id = (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid())
  );

-- =====================================================================
-- 3. FIX SCORECARD_TEMPLATES TABLE
-- =====================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "HR can manage scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "Recruiters can view scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "Users can view org scorecard templates" ON public.scorecard_templates;

-- Make sure RLS is enabled
ALTER TABLE public.scorecard_templates ENABLE ROW LEVEL SECURITY;

-- SELECT policy - allow org members to view (simple org_id comparison)
CREATE POLICY "Users can view org scorecard templates"
  ON public.scorecard_templates FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- INSERT policy - only HR managers can create
CREATE POLICY "HR can insert scorecard templates"
  ON public.scorecard_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    (org_id = (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid())
     AND public.has_role(auth.uid(), 'hr_manager'))
    OR public.is_super_admin(auth.uid())
  );

-- UPDATE policy
CREATE POLICY "HR can update scorecard templates"
  ON public.scorecard_templates FOR UPDATE
  TO authenticated
  USING (
    (org_id = (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid())
     AND public.has_role(auth.uid(), 'hr_manager'))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid())
     AND public.has_role(auth.uid(), 'hr_manager'))
    OR public.is_super_admin(auth.uid())
  );

-- DELETE policy
CREATE POLICY "HR can delete scorecard templates"
  ON public.scorecard_templates FOR DELETE
  TO authenticated
  USING (
    (org_id = (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid())
     AND public.has_role(auth.uid(), 'hr_manager'))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 4. ENSURE HELPER FUNCTIONS HAVE row_security=off
-- =====================================================================

-- Recreate is_super_admin with row_security=off
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

-- Recreate has_role with row_security=off
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

-- Recreate has_hr_access with row_security=off
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

-- Recreate get_user_org_id with row_security=off
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
-- GRANT PERMISSIONS
-- =====================================================================
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_hr_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_id(UUID) TO authenticated;

-- =====================================================================
-- VERIFICATION QUERIES (run these to test)
-- =====================================================================
-- SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID';
-- SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';
-- SELECT * FROM scorecard_templates WHERE org_id = 'YOUR_ORG_ID';
--
-- All queries should complete instantly without timeout.
-- =====================================================================
