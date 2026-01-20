-- Fix pipeline_stages RLS policy to allow HR managers to manage stages
-- Previously only org_admin could manage stages

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Org admins can manage stages" ON public.pipeline_stages;

-- Create new policy that includes HR managers
CREATE POLICY "HR and above can manage stages"
  ON public.pipeline_stages FOR ALL
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
