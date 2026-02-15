-- =====================================================================
-- FIX: career_page_blocks and career_page_assets RLS policies
-- =====================================================================
-- The original policies reference profiles.role which was removed when
-- RBAC was refactored to use the user_roles table. This caused the
-- "Admins can manage" policies to silently fail, preventing org_admins
-- from creating/updating/deleting career page blocks and assets.
-- =====================================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Admins can manage career page blocks" ON public.career_page_blocks;
DROP POLICY IF EXISTS "Admins can manage assets" ON public.career_page_assets;

-- Recreate career_page_blocks admin policy using user_roles table
CREATE POLICY "Admins can manage career page blocks"
ON public.career_page_blocks FOR ALL
TO authenticated
USING (
  org_id IN (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'org_admin')
    OR public.is_super_admin(auth.uid())
  )
)
WITH CHECK (
  org_id IN (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'org_admin')
    OR public.is_super_admin(auth.uid())
  )
);

-- Recreate career_page_assets admin policy using user_roles table
CREATE POLICY "Admins can manage assets"
ON public.career_page_assets FOR ALL
TO authenticated
USING (
  org_id IN (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'org_admin')
    OR public.is_super_admin(auth.uid())
  )
)
WITH CHECK (
  org_id IN (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'org_admin')
    OR public.is_super_admin(auth.uid())
  )
);
