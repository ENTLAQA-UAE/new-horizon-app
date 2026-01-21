-- =====================================================================
-- FIX PROFILES TABLE RLS - REMOVE SELF-REFERENCING POLICIES
-- =====================================================================
--
-- The previous migration created a policy with a subquery that references
-- the profiles table itself, causing RLS recursion and 500 errors.
--
-- This fix removes that policy and uses a simpler approach.
-- =====================================================================

-- Drop the problematic self-referencing policy
DROP POLICY IF EXISTS "Org members can view org profiles" ON public.profiles;

-- Drop other policies to recreate cleanly
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;

-- Make sure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- SIMPLE, NON-RECURSIVE POLICIES FOR PROFILES
-- =====================================================================

-- Users can ALWAYS view and update their own profile (no function calls, no recursion)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create a helper function to get user's org_id WITHOUT RLS
-- This is SECURITY DEFINER with row_security=off to avoid recursion
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

GRANT EXECUTE ON FUNCTION public.get_user_org_id(UUID) TO authenticated;

-- Org members can view other members' profiles using the safe helper function
CREATE POLICY "Org members can view org profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    org_id IS NOT NULL
    AND org_id = public.get_user_org_id(auth.uid())
  );

-- Super admin policies (only for admin operations, not needed for basic profile access)
CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- =====================================================================
-- VERIFICATION - Run these queries to test:
-- =====================================================================
-- SELECT id, email, org_id FROM profiles WHERE id = auth.uid();
-- This should return instantly without errors.
-- =====================================================================
