-- SUPERSEDED by 20260215_fix_requisition_approvals_rls_complete.sql
-- This policy is dropped and replaced in that migration because the
-- subquery on job_requisitions hits nested RLS and causes error 42501.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'requisition_approvals'
      AND policyname = 'Authenticated users can create requisition approvals'
  ) THEN
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
  END IF;
END $$;
