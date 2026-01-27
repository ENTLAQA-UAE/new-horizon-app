-- =====================================================
-- RBAC Blueprint Phases 3-6: Consolidated Migration
-- Run this AFTER the previous migration (20260128_rbac_blueprint_updates.sql)
-- =====================================================

-- =====================================================
-- Section 1: Phase 3A — Add 'pending_approval' to job_status enum
-- =====================================================
DO $$
BEGIN
  -- Add 'pending_approval' to job_status enum if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'pending_approval'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_status')
  ) THEN
    ALTER TYPE job_status ADD VALUE 'pending_approval';
  END IF;
END $$;

-- =====================================================
-- Section 2: Phase 3A — Create job_approvals table
-- =====================================================
CREATE TABLE IF NOT EXISTS job_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  responded_at TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_job_approvals_job_id ON job_approvals(job_id);
CREATE INDEX IF NOT EXISTS idx_job_approvals_approver_id ON job_approvals(approver_id);

-- RLS for job_approvals
ALTER TABLE job_approvals ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view job approvals in their org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'job_approvals' AND policyname = 'job_approvals_select_policy'
  ) THEN
    CREATE POLICY job_approvals_select_policy ON job_approvals
      FOR SELECT USING (
        approver_id = auth.uid()
        OR job_id IN (SELECT id FROM jobs WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'job_approvals' AND policyname = 'job_approvals_insert_policy'
  ) THEN
    CREATE POLICY job_approvals_insert_policy ON job_approvals
      FOR INSERT WITH CHECK (
        job_id IN (SELECT id FROM jobs WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'job_approvals' AND policyname = 'job_approvals_update_policy'
  ) THEN
    CREATE POLICY job_approvals_update_policy ON job_approvals
      FOR UPDATE USING (
        approver_id = auth.uid()
        OR job_id IN (SELECT id FROM jobs WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
      );
  END IF;
END $$;

-- =====================================================
-- Section 3: Phase 4A — Create user_role_departments table
-- Links hiring_managers to specific departments for data scoping
-- =====================================================
CREATE TABLE IF NOT EXISTS user_role_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, org_id, department_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_role_departments_user_id ON user_role_departments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_departments_org_id ON user_role_departments(org_id);
CREATE INDEX IF NOT EXISTS idx_user_role_departments_department_id ON user_role_departments(department_id);

-- RLS for user_role_departments
ALTER TABLE user_role_departments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_role_departments' AND policyname = 'urd_select_policy'
  ) THEN
    CREATE POLICY urd_select_policy ON user_role_departments
      FOR SELECT USING (
        user_id = auth.uid()
        OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_role_departments' AND policyname = 'urd_insert_policy'
  ) THEN
    CREATE POLICY urd_insert_policy ON user_role_departments
      FOR INSERT WITH CHECK (
        org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_role_departments' AND policyname = 'urd_update_policy'
  ) THEN
    CREATE POLICY urd_update_policy ON user_role_departments
      FOR UPDATE USING (
        org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_role_departments' AND policyname = 'urd_delete_policy'
  ) THEN
    CREATE POLICY urd_delete_policy ON user_role_departments
      FOR DELETE USING (
        org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
      );
  END IF;
END $$;

-- =====================================================
-- Section 4: Phase 4A — Helper functions
-- =====================================================

-- Get all department IDs for a user in an org
CREATE OR REPLACE FUNCTION get_user_departments(_user_id UUID, _org_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT department_id
  FROM user_role_departments
  WHERE user_id = _user_id AND org_id = _org_id;
$$;

-- Check if a user is assigned to a specific department
CREATE OR REPLACE FUNCTION is_in_department(_user_id UUID, _department_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_role_departments
    WHERE user_id = _user_id AND department_id = _department_id
  );
$$;

-- =====================================================
-- Section 5: Fix prior failed Section 5 (notification_logs)
-- Only runs if notification_logs table exists
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_logs' AND table_schema = 'public') THEN
    -- Enable RLS
    ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

    -- Create policies if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_logs' AND policyname = 'notification_logs_select') THEN
      CREATE POLICY notification_logs_select ON notification_logs
        FOR SELECT USING (
          user_id = auth.uid()
          OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_logs' AND policyname = 'notification_logs_insert') THEN
      CREATE POLICY notification_logs_insert ON notification_logs
        FOR INSERT WITH CHECK (
          org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
        );
    END IF;
  END IF;
END $$;

-- =====================================================
-- Done! All Phases 3-6 database changes applied.
-- =====================================================
