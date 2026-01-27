-- =====================================================
-- RBAC Blueprint Updates
-- =====================================================
-- Implements database-level changes for the approved RBAC blueprint:
-- 1. Fix broken RLS policies on notification tables (was referencing profiles.role)
-- 2. Move notification settings access from org_admin to hr_manager
-- 3. Update has_hr_access() to remove org_admin (org_admin = org settings only)
-- 4. Rename "Hiring Manager" to "Department Manager" in roles table
-- =====================================================

-- =====================================================
-- 1. RENAME HIRING MANAGER TO DEPARTMENT MANAGER
-- =====================================================
UPDATE roles
SET
  name = 'Department Manager',
  name_ar = 'مدير القسم',
  description = 'Department Manager with access to department hiring, requisitions, interviews, and scorecards',
  description_ar = 'مدير القسم مع صلاحية الوصول لتوظيف القسم وطلبات التوظيف والمقابلات وبطاقات التقييم'
WHERE code = 'hiring_manager';

-- =====================================================
-- 2. FIX has_hr_access() — REMOVE org_admin
-- Per blueprint: org_admin manages org settings ONLY.
-- HR access = super_admin + hr_manager (not org_admin)
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_hr_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for HR-level roles using unified has_role function
  -- Per RBAC blueprint: only super_admin and hr_manager have HR access
  -- org_admin is excluded (manages org settings only, not ATS)
  IF public.has_role(_user_id, 'super_admin'::varchar, NULL) THEN
    RETURN true;
  END IF;

  IF public.has_role(_user_id, 'hr_manager'::varchar, NULL) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- =====================================================
-- 3. CREATE has_notification_admin_access() HELPER
-- Used by RLS policies to check notification settings access
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_notification_admin_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Per RBAC blueprint: hr_manager owns notification settings
  -- super_admin can access everything
  IF public.has_role(_user_id, 'super_admin'::varchar, NULL) THEN
    RETURN true;
  END IF;

  IF public.has_role(_user_id, 'hr_manager'::varchar, NULL) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- =====================================================
-- 4. FIX RLS POLICIES ON NOTIFICATION TABLES
-- The original policies reference profiles.role which doesn't exist.
-- Replace with has_role() function calls.
-- Also change access from org_admin to hr_manager.
-- =====================================================

-- Drop broken policies first (they reference non-existent profiles.role column)
DROP POLICY IF EXISTS "Admins can manage org notification settings" ON org_notification_settings;
DROP POLICY IF EXISTS "Admins can manage org email templates" ON org_email_templates;
DROP POLICY IF EXISTS "Super admins can manage default templates" ON default_email_templates;

-- Also drop read policies that might conflict
DROP POLICY IF EXISTS "Users can view their org notification settings" ON org_notification_settings;
DROP POLICY IF EXISTS "Users can view their org email templates" ON org_email_templates;
DROP POLICY IF EXISTS "Users can view default templates" ON default_email_templates;

-- Recreate notification settings policies using has_role() function
-- hr_manager + super_admin can manage org notification settings
CREATE POLICY "HR managers can manage org notification settings"
ON org_notification_settings FOR ALL
USING (
  public.has_notification_admin_access(auth.uid())
  AND org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
);

-- All org members can read their org notification settings
CREATE POLICY "Org members can view notification settings"
ON org_notification_settings FOR SELECT
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- hr_manager + super_admin can manage email templates
CREATE POLICY "HR managers can manage org email templates"
ON org_email_templates FOR ALL
USING (
  public.has_notification_admin_access(auth.uid())
  AND org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
);

-- All org members can read email templates (needed for sending)
CREATE POLICY "Org members can view email templates"
ON org_email_templates FOR SELECT
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Super admins only for default templates
CREATE POLICY "Super admins can manage default templates"
ON default_email_templates FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::varchar, NULL));

-- All authenticated users can read default templates (fallback templates)
CREATE POLICY "Authenticated users can view default templates"
ON default_email_templates FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 5. UPDATE notification_logs RLS (if exists)
-- Ensure notification logs are accessible by hr_manager
-- =====================================================
DROP POLICY IF EXISTS "Admins can view notification logs" ON notification_logs;
DROP POLICY IF EXISTS "Users can view their own notification logs" ON notification_logs;

-- hr_manager + super_admin can view all org notification logs
CREATE POLICY "HR managers can view notification logs"
ON notification_logs FOR SELECT
USING (
  public.has_notification_admin_access(auth.uid())
  AND (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    OR org_id IS NULL -- platform-level logs for super_admin
  )
);

-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
ON notification_logs FOR SELECT
USING (recipient_id = auth.uid());
