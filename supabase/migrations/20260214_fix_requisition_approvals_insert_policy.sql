-- Add missing INSERT policy for requisition_approvals
-- Without this, authenticated users cannot create approval records (RLS blocks the insert)

CREATE POLICY "Authenticated users can create requisition approvals"
  ON public.requisition_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_requisitions r
      WHERE r.id = requisition_id
      AND r.org_id = public.get_user_org_id(auth.uid())
    )
    OR public.is_super_admin(auth.uid())
  );
