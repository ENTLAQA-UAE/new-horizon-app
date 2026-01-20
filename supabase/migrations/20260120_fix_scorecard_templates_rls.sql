-- Fix scorecard_templates RLS policy to work with profile-based roles
-- The current policy uses has_role() which may not be properly set up for all users

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view scorecard templates in their org" ON public.scorecard_templates;
DROP POLICY IF EXISTS "HR and above can manage scorecard templates" ON public.scorecard_templates;

-- Create a helper function to check if user has HR-level access
-- This checks both the user_roles table AND the profiles table for flexibility
CREATE OR REPLACE FUNCTION public.has_hr_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access BOOLEAN := false;
  v_profile_role TEXT;
BEGIN
  -- Check profiles table for role
  SELECT role INTO v_profile_role FROM public.profiles WHERE id = _user_id;

  IF v_profile_role IN ('org_admin', 'hr_manager', 'super_admin') THEN
    RETURN true;
  END IF;

  -- Check user_roles table
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
    AND r.code IN ('org_admin', 'hr_manager')
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$;

-- Recreate policies with the new flexible function

-- SELECT policy: Anyone in the org can view templates
CREATE POLICY "Users can view scorecard templates in their org"
  ON public.scorecard_templates FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- INSERT policy: HR and above can create templates
CREATE POLICY "HR can create scorecard templates"
  ON public.scorecard_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_hr_access(auth.uid()))
    OR public.is_super_admin(auth.uid())
  );

-- UPDATE policy: HR and above can update templates in their org
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

-- DELETE policy: HR and above can delete templates in their org
CREATE POLICY "HR can delete scorecard templates"
  ON public.scorecard_templates FOR DELETE
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_hr_access(auth.uid()))
    OR public.is_super_admin(auth.uid())
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.has_hr_access(UUID) TO authenticated;
