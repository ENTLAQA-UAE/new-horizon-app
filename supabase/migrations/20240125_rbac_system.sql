-- =====================================================
-- RBAC (Role-Based Access Control) System
-- =====================================================
-- This migration creates the complete RBAC system for Jadarat ATS
-- Supports 6 user roles: super_admin, org_admin, hr_manager, recruiter, hiring_manager, candidate

-- =====================================================
-- 1. ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for system roles
  code VARCHAR(50) NOT NULL, -- Unique identifier like 'super_admin', 'recruiter'
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  description TEXT,
  description_ar TEXT,
  is_system_role BOOLEAN DEFAULT false, -- System roles cannot be deleted
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, code)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_roles_org_id ON roles(org_id);
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles(is_system_role);

-- =====================================================
-- 2. PERMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'jobs.create', 'candidates.read'
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  category VARCHAR(50) NOT NULL, -- jobs, candidates, applications, interviews, offers, organization, analytics, compliance
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);

-- =====================================================
-- 3. ROLE_PERMISSIONS JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- =====================================================
-- 4. USER_ROLES JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for super_admin
  is_primary BOOLEAN DEFAULT false, -- Primary role for the user in this org
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ, -- Optional role expiration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id, org_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON user_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_primary ON user_roles(is_primary);

-- =====================================================
-- 5. ROLE AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS role_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL, -- 'role_assigned', 'role_removed', 'role_created', 'role_updated', 'permission_changed'
  role_id UUID REFERENCES roles(id),
  org_id UUID REFERENCES organizations(id),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_audit_user ON role_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_target ON role_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_action ON role_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_role_audit_created ON role_audit_logs(created_at);

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. RLS POLICIES FOR ROLES
-- =====================================================
-- Everyone can read system roles
CREATE POLICY "Anyone can read system roles"
  ON roles FOR SELECT
  USING (is_system_role = true);

-- Users can read roles for their organization
CREATE POLICY "Users can read org roles"
  ON roles FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Only org admins and super admins can manage org roles
CREATE POLICY "Admins can manage org roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND (r.code = 'super_admin' OR (r.code = 'org_admin' AND ur.org_id = roles.org_id))
    )
  );

-- =====================================================
-- 8. RLS POLICIES FOR PERMISSIONS
-- =====================================================
-- Everyone can read permissions
CREATE POLICY "Anyone can read permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- Only super admins can manage permissions
CREATE POLICY "Super admins can manage permissions"
  ON permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.code = 'super_admin'
    )
  );

-- =====================================================
-- 9. RLS POLICIES FOR ROLE_PERMISSIONS
-- =====================================================
-- Users can read role permissions for roles they have access to
CREATE POLICY "Users can read role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (
    role_id IN (
      SELECT id FROM roles WHERE is_system_role = true
      UNION
      SELECT r.id FROM roles r
      JOIN user_roles ur ON r.org_id = ur.org_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- Only admins can manage role permissions
CREATE POLICY "Admins can manage role permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND (r.code = 'super_admin' OR r.code = 'org_admin')
    )
  );

-- =====================================================
-- 10. RLS POLICIES FOR USER_ROLES
-- =====================================================
-- Users can see their own roles
CREATE POLICY "Users can read own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can see all roles in their org
CREATE POLICY "Admins can read org user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND (r.code = 'super_admin' OR (r.code = 'org_admin' AND ur.org_id = user_roles.org_id))
    )
  );

-- Only admins can assign/remove roles
CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND (r.code = 'super_admin' OR (r.code = 'org_admin' AND ur.org_id = user_roles.org_id))
    )
  );

-- =====================================================
-- 11. RLS POLICIES FOR ROLE AUDIT LOGS
-- =====================================================
CREATE POLICY "Admins can read role audit logs"
  ON role_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND (r.code = 'super_admin' OR (r.code = 'org_admin' AND ur.org_id = role_audit_logs.org_id))
    )
  );

CREATE POLICY "System can insert audit logs"
  ON role_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- 12. HELPER FUNCTIONS
-- =====================================================

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_permission_code VARCHAR,
  p_org_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    AND p.code = p_permission_code
    AND p.is_active = true
    AND r.is_active = true
    AND (
      p_org_id IS NULL
      OR ur.org_id IS NULL  -- Super admin has no org_id
      OR ur.org_id = p_org_id
    )
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_org_id UUID DEFAULT NULL
)
RETURNS TABLE (permission_code VARCHAR, permission_name VARCHAR, category VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.code::VARCHAR,
    p.name::VARCHAR,
    p.category::VARCHAR
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
  AND p.is_active = true
  AND r.is_active = true
  AND (
    p_org_id IS NULL
    OR ur.org_id IS NULL
    OR ur.org_id = p_org_id
  )
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY p.category, p.code;
END;
$$;

-- Function to get user's roles
CREATE OR REPLACE FUNCTION get_user_roles(
  p_user_id UUID,
  p_org_id UUID DEFAULT NULL
)
RETURNS TABLE (
  role_id UUID,
  role_code VARCHAR,
  role_name VARCHAR,
  org_id UUID,
  is_primary BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.code::VARCHAR,
    r.name::VARCHAR,
    ur.org_id,
    ur.is_primary
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
  AND r.is_active = true
  AND (
    p_org_id IS NULL
    OR ur.org_id IS NULL
    OR ur.org_id = p_org_id
  )
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY ur.is_primary DESC, r.code;
END;
$$;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(
  p_user_id UUID,
  p_role_code VARCHAR,
  p_org_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_role BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    AND r.code = p_role_code
    AND r.is_active = true
    AND (
      p_org_id IS NULL
      OR ur.org_id IS NULL
      OR ur.org_id = p_org_id
    )
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO v_has_role;

  RETURN v_has_role;
END;
$$;

-- =====================================================
-- 13. UPDATE PROFILES TABLE
-- =====================================================
-- Add primary_role field to profiles for quick access
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS primary_role_id UUID REFERENCES roles(id),
ADD COLUMN IF NOT EXISTS primary_org_id UUID REFERENCES organizations(id);

-- =====================================================
-- 14. COMMENTS
-- =====================================================
COMMENT ON TABLE roles IS 'Stores all system and organization roles';
COMMENT ON TABLE permissions IS 'Stores all available permissions in the system';
COMMENT ON TABLE role_permissions IS 'Maps permissions to roles';
COMMENT ON TABLE user_roles IS 'Maps users to roles with optional org scope';
COMMENT ON TABLE role_audit_logs IS 'Audit trail for all role-related changes';
COMMENT ON FUNCTION has_permission IS 'Check if a user has a specific permission';
COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user';
COMMENT ON FUNCTION get_user_roles IS 'Get all roles for a user';
COMMENT ON FUNCTION has_role IS 'Check if a user has a specific role';
