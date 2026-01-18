-- =====================================================
-- DATABASE FIX MIGRATION
-- =====================================================
-- Fixes the following issues:
-- 1. Conflicting has_role function signatures
-- 2. Missing organization_members table referenced in RLS policies
-- 3. RLS policy conflicts between simple and complex RBAC
-- =====================================================

-- =====================================================
-- STEP 1: DROP CONFLICTING POLICIES ON org_integrations
-- =====================================================
-- These policies reference organization_members which doesn't exist

DO $$
BEGIN
  -- Drop policies on org_integrations if they exist
  DROP POLICY IF EXISTS "Org members can view org integrations" ON org_integrations;
  DROP POLICY IF EXISTS "Org admins can insert org integrations" ON org_integrations;
  DROP POLICY IF EXISTS "Org admins can update org integrations" ON org_integrations;
  DROP POLICY IF EXISTS "Org admins can delete org integrations" ON org_integrations;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, nothing to do
    NULL;
END $$;

-- =====================================================
-- STEP 2: CREATE UNIFIED HELPER FUNCTIONS
-- =====================================================

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, VARCHAR, UUID) CASCADE;

-- Create unified has_role function that checks BOTH systems
-- Checks simple user_roles (enum) AND complex roles/user_roles tables
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role_code VARCHAR, _org_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_role BOOLEAN := false;
  v_app_role public.app_role;
BEGIN
  -- First, try to check the simple user_roles table with enum
  BEGIN
    -- Try to cast the role code to the enum type
    v_app_role := _role_code::public.app_role;

    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = v_app_role
    ) INTO v_has_role;

    IF v_has_role THEN
      RETURN true;
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN
      -- The role code is not a valid enum value, continue to check complex RBAC
      NULL;
    WHEN undefined_column THEN
      -- The table doesn't have 'role' column (might be complex RBAC table)
      NULL;
  END;

  -- Then, check the complex RBAC system (roles + role_permissions)
  BEGIN
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = _user_id
        AND r.code = _role_code
        AND r.is_active = true
        AND (
          _org_id IS NULL
          OR ur.org_id IS NULL  -- System roles have no org_id
          OR ur.org_id = _org_id
        )
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ) INTO v_has_role;
  EXCEPTION
    WHEN undefined_column THEN
      -- Complex RBAC tables don't exist or have different schema
      NULL;
    WHEN undefined_table THEN
      NULL;
  END;

  RETURN COALESCE(v_has_role, false);
END;
$$;

-- Create overload for enum-based calls (backward compatibility)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Recreate is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
BEGIN
  -- Check simple enum-based system
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::public.app_role
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Check complex RBAC system
  BEGIN
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = _user_id
        AND r.code = 'super_admin'
        AND r.is_active = true
    ) INTO v_is_admin;
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
    WHEN undefined_table THEN
      NULL;
  END;

  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- Recreate get_user_org_id function
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = _user_id
$$;

-- =====================================================
-- STEP 3: FIX org_integrations TABLE RLS POLICIES
-- =====================================================
-- Replace policies that reference organization_members with correct ones

DO $$
BEGIN
  -- Check if org_integrations table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'org_integrations' AND table_schema = 'public') THEN
    -- Create new policies using correct functions

    -- Drop existing policies first (if any remain)
    DROP POLICY IF EXISTS "Org members can view org integrations" ON org_integrations;
    DROP POLICY IF EXISTS "Org admins can insert org integrations" ON org_integrations;
    DROP POLICY IF EXISTS "Org admins can update org integrations" ON org_integrations;
    DROP POLICY IF EXISTS "Org admins can delete org integrations" ON org_integrations;
    DROP POLICY IF EXISTS "Users can view their org integrations" ON org_integrations;
    DROP POLICY IF EXISTS "Admins can manage org integrations" ON org_integrations;

    -- Create new SELECT policy
    CREATE POLICY "Users can view their org integrations"
      ON org_integrations FOR SELECT
      TO authenticated
      USING (
        org_id = public.get_user_org_id(auth.uid())
        OR public.is_super_admin(auth.uid())
      );

    -- Create new INSERT policy
    CREATE POLICY "Admins can insert org integrations"
      ON org_integrations FOR INSERT
      TO authenticated
      WITH CHECK (
        (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
        OR public.is_super_admin(auth.uid())
      );

    -- Create new UPDATE policy
    CREATE POLICY "Admins can update org integrations"
      ON org_integrations FOR UPDATE
      TO authenticated
      USING (
        (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
        OR public.is_super_admin(auth.uid())
      )
      WITH CHECK (
        (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
        OR public.is_super_admin(auth.uid())
      );

    -- Create new DELETE policy
    CREATE POLICY "Admins can delete org integrations"
      ON org_integrations FOR DELETE
      TO authenticated
      USING (
        (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
        OR public.is_super_admin(auth.uid())
      );
  END IF;
END $$;

-- =====================================================
-- STEP 4: ENSURE PROPER POLICIES ON organization_integrations
-- =====================================================
-- This is the main integrations table from the newer migration

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_integrations' AND table_schema = 'public') THEN
    -- Ensure RLS is enabled
    ALTER TABLE organization_integrations ENABLE ROW LEVEL SECURITY;

    -- Drop and recreate policies
    DROP POLICY IF EXISTS "Org members can view integrations" ON organization_integrations;
    DROP POLICY IF EXISTS "Org admins can insert integrations" ON organization_integrations;
    DROP POLICY IF EXISTS "Org admins can update integrations" ON organization_integrations;
    DROP POLICY IF EXISTS "Org admins can delete integrations" ON organization_integrations;

    -- SELECT policy
    CREATE POLICY "Org members can view integrations"
      ON organization_integrations FOR SELECT
      TO authenticated
      USING (
        org_id = public.get_user_org_id(auth.uid())
        OR public.is_super_admin(auth.uid())
      );

    -- INSERT policy
    CREATE POLICY "Org admins can insert integrations"
      ON organization_integrations FOR INSERT
      TO authenticated
      WITH CHECK (
        (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
        OR public.is_super_admin(auth.uid())
      );

    -- UPDATE policy
    CREATE POLICY "Org admins can update integrations"
      ON organization_integrations FOR UPDATE
      TO authenticated
      USING (
        (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
        OR public.is_super_admin(auth.uid())
      )
      WITH CHECK (
        (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
        OR public.is_super_admin(auth.uid())
      );

    -- DELETE policy
    CREATE POLICY "Org admins can delete integrations"
      ON organization_integrations FOR DELETE
      TO authenticated
      USING (
        (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
        OR public.is_super_admin(auth.uid())
      );
  END IF;
END $$;

-- =====================================================
-- STEP 5: FIX organization_email_config POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_email_config' AND table_schema = 'public') THEN
    ALTER TABLE organization_email_config ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Org members can view email config" ON organization_email_config;
    DROP POLICY IF EXISTS "Org admins can insert email config" ON organization_email_config;
    DROP POLICY IF EXISTS "Org admins can update email config" ON organization_email_config;

    CREATE POLICY "Org members can view email config"
      ON organization_email_config FOR SELECT
      TO authenticated
      USING (
        org_id = public.get_user_org_id(auth.uid())
        OR public.is_super_admin(auth.uid())
      );

    CREATE POLICY "Org admins can insert email config"
      ON organization_email_config FOR INSERT
      TO authenticated
      WITH CHECK (
        (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
        OR public.is_super_admin(auth.uid())
      );

    CREATE POLICY "Org admins can update email config"
      ON organization_email_config FOR UPDATE
      TO authenticated
      USING (
        (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
        OR public.is_super_admin(auth.uid())
      )
      WITH CHECK (
        (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
        OR public.is_super_admin(auth.uid())
      );
  END IF;
END $$;

-- =====================================================
-- STEP 6: FIX organization_email_logs POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_email_logs' AND table_schema = 'public') THEN
    ALTER TABLE organization_email_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Org members can view email logs" ON organization_email_logs;
    DROP POLICY IF EXISTS "System can insert email logs" ON organization_email_logs;

    CREATE POLICY "Org members can view email logs"
      ON organization_email_logs FOR SELECT
      TO authenticated
      USING (
        org_id = public.get_user_org_id(auth.uid())
        OR public.is_super_admin(auth.uid())
      );

    CREATE POLICY "System can insert email logs"
      ON organization_email_logs FOR INSERT
      TO authenticated
      WITH CHECK (
        org_id = public.get_user_org_id(auth.uid())
        OR public.is_super_admin(auth.uid())
      );
  END IF;
END $$;

-- =====================================================
-- STEP 7: FIX integration_webhook_logs POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_webhook_logs' AND table_schema = 'public') THEN
    ALTER TABLE integration_webhook_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Org admins can view webhook logs" ON integration_webhook_logs;

    CREATE POLICY "Org admins can view webhook logs"
      ON integration_webhook_logs FOR SELECT
      TO authenticated
      USING (
        (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
        OR public.is_super_admin(auth.uid())
      );
  END IF;
END $$;

-- =====================================================
-- STEP 8: ADD COMMENTS
-- =====================================================
COMMENT ON FUNCTION public.has_role(UUID, VARCHAR, UUID) IS 'Check if a user has a specific role (works with both simple enum and complex RBAC systems)';
COMMENT ON FUNCTION public.has_role(UUID, public.app_role) IS 'Check if a user has a specific role (enum-based, for backward compatibility)';
COMMENT ON FUNCTION public.is_super_admin(UUID) IS 'Check if a user is a super admin (works with both RBAC systems)';
COMMENT ON FUNCTION public.get_user_org_id(UUID) IS 'Get the organization ID for a user from their profile';

-- =====================================================
-- STEP 9: FIX workflows TABLE POLICIES
-- =====================================================
-- These policies reference organization_members which doesn't exist

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflows' AND table_schema = 'public') THEN
    ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies
    DROP POLICY IF EXISTS "Org members can view workflows" ON workflows;
    DROP POLICY IF EXISTS "Org admins can manage workflows" ON workflows;

    -- Create new SELECT policy
    CREATE POLICY "Org members can view workflows"
      ON workflows FOR SELECT
      TO authenticated
      USING (
        organization_id = public.get_user_org_id(auth.uid())
        OR public.is_super_admin(auth.uid())
      );

    -- Create new ALL policy for admins
    CREATE POLICY "Org admins can manage workflows"
      ON workflows FOR ALL
      TO authenticated
      USING (
        (organization_id = public.get_user_org_id(auth.uid()) AND (
          public.has_role(auth.uid(), 'org_admin')
          OR public.has_role(auth.uid(), 'hr_manager')
        ))
        OR public.is_super_admin(auth.uid())
      )
      WITH CHECK (
        (organization_id = public.get_user_org_id(auth.uid()) AND (
          public.has_role(auth.uid(), 'org_admin')
          OR public.has_role(auth.uid(), 'hr_manager')
        ))
        OR public.is_super_admin(auth.uid())
      );
  END IF;
END $$;

-- =====================================================
-- STEP 10: FIX workflow_executions TABLE POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_executions' AND table_schema = 'public') THEN
    ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies
    DROP POLICY IF EXISTS "Org members can view workflow executions" ON workflow_executions;

    -- Create new SELECT policy
    CREATE POLICY "Org members can view workflow executions"
      ON workflow_executions FOR SELECT
      TO authenticated
      USING (
        workflow_id IN (
          SELECT id FROM workflows
          WHERE organization_id = public.get_user_org_id(auth.uid())
        )
        OR public.is_super_admin(auth.uid())
      );
  END IF;
END $$;

-- =====================================================
-- STEP 11: FIX documents TABLE POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies
    DROP POLICY IF EXISTS "Org members can view documents" ON documents;
    DROP POLICY IF EXISTS "Org members can manage documents" ON documents;

    -- Create new SELECT policy
    CREATE POLICY "Org members can view documents"
      ON documents FOR SELECT
      TO authenticated
      USING (
        organization_id = public.get_user_org_id(auth.uid())
        OR public.is_super_admin(auth.uid())
      );

    -- Create new ALL policy
    CREATE POLICY "Org members can manage documents"
      ON documents FOR ALL
      TO authenticated
      USING (
        organization_id = public.get_user_org_id(auth.uid())
        OR public.is_super_admin(auth.uid())
      )
      WITH CHECK (
        organization_id = public.get_user_org_id(auth.uid())
        OR public.is_super_admin(auth.uid())
      );
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
