-- =====================================================================
-- FIX SCORECARD_TEMPLATES RLS - USE SAFE HELPER FUNCTIONS
-- =====================================================================
--
-- The previous policies used subqueries like:
--   (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid())
-- This triggers profiles RLS which can cause timeouts/recursion.
--
-- Fix: Use get_user_org_id() helper function with row_security=off
-- =====================================================================

-- Ensure helper function exists with row_security=off
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

-- Ensure has_role function has row_security=off
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

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- =====================================================================
-- DROP ALL EXISTING SCORECARD_TEMPLATES POLICIES
-- =====================================================================
DROP POLICY IF EXISTS "HR can manage scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "Recruiters can view scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "Users can view org scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "HR can insert scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "HR can update scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "HR can delete scorecard templates" ON public.scorecard_templates;

-- Enable RLS
ALTER TABLE public.scorecard_templates ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- NEW POLICIES USING SAFE HELPER FUNCTIONS (NO SUBQUERIES!)
-- =====================================================================

-- SELECT: Org members can view templates (uses safe helper)
CREATE POLICY "Users can view org scorecard templates"
  ON public.scorecard_templates FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- INSERT: HR managers can create templates (uses safe helpers)
CREATE POLICY "HR can insert scorecard templates"
  ON public.scorecard_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid())
     AND public.has_role(auth.uid(), 'hr_manager'::public.app_role))
    OR public.is_super_admin(auth.uid())
  );

-- UPDATE: HR managers can update templates (uses safe helpers)
CREATE POLICY "HR can update scorecard templates"
  ON public.scorecard_templates FOR UPDATE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid())
     AND public.has_role(auth.uid(), 'hr_manager'::public.app_role))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid())
     AND public.has_role(auth.uid(), 'hr_manager'::public.app_role))
    OR public.is_super_admin(auth.uid())
  );

-- DELETE: HR managers can delete templates (uses safe helpers)
CREATE POLICY "HR can delete scorecard templates"
  ON public.scorecard_templates FOR DELETE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid())
     AND public.has_role(auth.uid(), 'hr_manager'::public.app_role))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- VERIFICATION
-- =====================================================================
-- Test as HR manager:
-- INSERT INTO scorecard_templates (name, org_id, ...) VALUES (...);
-- Should complete instantly without timeout.
-- =====================================================================
