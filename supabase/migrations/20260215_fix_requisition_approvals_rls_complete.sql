-- =============================================================================
-- Fix requisition_approvals RLS policies (INSERT + DELETE)
--
-- Problem: The existing INSERT policy's WITH CHECK does a subquery on
-- job_requisitions, which itself has RLS. The nested RLS evaluation causes
-- the check to fail (error 42501). Also, no DELETE policy exists at all.
--
-- Solution: Use a SECURITY DEFINER helper function with row_security=off
-- to bypass RLS recursion when checking org membership.
-- =============================================================================

-- Step 1: Create a SECURITY DEFINER helper that checks if a requisition
-- belongs to a given user's org (bypasses RLS on job_requisitions & profiles)
CREATE OR REPLACE FUNCTION public.is_requisition_in_user_org(
  p_requisition_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_requisitions r
    WHERE r.id = p_requisition_id
      AND r.org_id = (SELECT org_id FROM public.profiles WHERE id = p_user_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_requisition_in_user_org(UUID, UUID) TO authenticated;

-- Step 2: Drop the old INSERT policy that fails due to nested RLS
DROP POLICY IF EXISTS "Authenticated users can create requisition approvals"
  ON public.requisition_approvals;

-- Step 3: Create a new INSERT policy using the SECURITY DEFINER helper
CREATE POLICY "Org members can insert requisition approvals"
  ON public.requisition_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_requisition_in_user_org(requisition_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- Step 4: Add the missing DELETE policy (needed when deleting requisitions)
CREATE POLICY "Org members can delete requisition approvals"
  ON public.requisition_approvals FOR DELETE
  TO authenticated
  USING (
    public.is_requisition_in_user_org(requisition_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );
