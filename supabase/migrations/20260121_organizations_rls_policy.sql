-- =============================================
-- FIX: Add RLS policies for organizations table
-- =============================================
-- The organizations table has RLS enabled but no policies,
-- which prevents users from reading their organization data.

-- Allow users to read their own organization
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

-- Allow super admins to view all organizations
CREATE POLICY "Super admins can view all organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Allow super admins to manage all organizations
CREATE POLICY "Super admins can manage organizations"
  ON public.organizations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Allow org admins to update their organization
CREATE POLICY "Org admins can update their organization"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('org_admin', 'hr_manager')
    )
  )
  WITH CHECK (
    id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('org_admin', 'hr_manager')
    )
  );
