-- =====================================================================
-- FIX: user_roles unique constraint
-- =====================================================================
-- The table has UNIQUE(user_id, role) which prevents a user from having
-- the same role across different orgs (e.g. org_admin of org A, then
-- org_admin of org B). The correct constraint is (user_id, org_id)
-- since a user should have one role per org, not one role globally.
--
-- The code already uses onConflict: "user_id,org_id" for upserts,
-- but the matching constraint doesn't exist.
-- =====================================================================

-- Drop the incorrect constraint
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add the correct constraint
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_org_id_key UNIQUE (user_id, org_id);

-- Add index for the new constraint pattern
CREATE INDEX IF NOT EXISTS idx_user_roles_org_id ON public.user_roles(org_id);
