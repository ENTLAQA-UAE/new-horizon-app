-- =====================================================
-- RBAC SEED DATA
-- =====================================================
-- This migration seeds the default roles and permissions

-- =====================================================
-- 1. INSERT SYSTEM ROLES
-- =====================================================
INSERT INTO roles (code, name, name_ar, description, description_ar, is_system_role, org_id) VALUES
  ('super_admin', 'Super Admin', 'مدير النظام', 'Platform administrator with full access to all organizations and settings', 'مدير المنصة مع صلاحية الوصول الكاملة لجميع المؤسسات والإعدادات', true, NULL),
  ('org_admin', 'Organization Admin', 'مدير المؤسسة', 'Organization administrator with full access to organization settings and users', 'مدير المؤسسة مع صلاحية الوصول الكاملة لإعدادات المؤسسة والمستخدمين', true, NULL),
  ('hr_manager', 'HR Manager', 'مدير الموارد البشرية', 'HR Manager with access to workflows, templates, compliance, and analytics', 'مدير الموارد البشرية مع صلاحية الوصول للإجراءات والقوالب والامتثال والتحليلات', true, NULL),
  ('recruiter', 'Recruiter', 'موظف التوظيف', 'Recruiter with access to jobs, candidates, applications, and interviews', 'موظف التوظيف مع صلاحية الوصول للوظائف والمرشحين والطلبات والمقابلات', true, NULL),
  ('hiring_manager', 'Hiring Manager', 'مدير التوظيف', 'Hiring Manager with access to review candidates, interviews, and approve offers', 'مدير التوظيف مع صلاحية مراجعة المرشحين والمقابلات والموافقة على العروض', true, NULL),
  ('candidate', 'Candidate', 'المرشح', 'Job candidate with access to portal, applications, and interviews', 'المرشح للوظيفة مع صلاحية الوصول للبوابة والطلبات والمقابلات', true, NULL)
ON CONFLICT (org_id, code) DO NOTHING;

-- =====================================================
-- 2. INSERT PERMISSIONS
-- =====================================================

-- PLATFORM PERMISSIONS (Super Admin only)
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('platform.manage', 'Manage Platform', 'إدارة المنصة', 'platform', 'Full platform management access'),
  ('platform.organizations.create', 'Create Organizations', 'إنشاء مؤسسات', 'platform', 'Create new organizations'),
  ('platform.organizations.read', 'View Organizations', 'عرض المؤسسات', 'platform', 'View all organizations'),
  ('platform.organizations.update', 'Update Organizations', 'تعديل المؤسسات', 'platform', 'Update organization details'),
  ('platform.organizations.delete', 'Delete Organizations', 'حذف المؤسسات', 'platform', 'Delete organizations'),
  ('platform.tiers.manage', 'Manage Subscription Tiers', 'إدارة باقات الاشتراك', 'platform', 'Create and manage subscription tiers'),
  ('platform.billing.manage', 'Manage Billing', 'إدارة الفواتير', 'platform', 'Manage platform billing'),
  ('platform.settings.manage', 'Manage Platform Settings', 'إدارة إعدادات المنصة', 'platform', 'Manage platform-wide settings'),
  ('platform.users.manage', 'Manage All Users', 'إدارة جميع المستخدمين', 'platform', 'Manage users across all organizations')
ON CONFLICT (code) DO NOTHING;

-- ORGANIZATION PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('organization.settings.read', 'View Organization Settings', 'عرض إعدادات المؤسسة', 'organization', 'View organization settings'),
  ('organization.settings.update', 'Update Organization Settings', 'تعديل إعدادات المؤسسة', 'organization', 'Update organization settings'),
  ('organization.branding.manage', 'Manage Branding', 'إدارة الهوية', 'organization', 'Manage organization branding'),
  ('organization.departments.manage', 'Manage Departments', 'إدارة الأقسام', 'organization', 'Create and manage departments'),
  ('organization.locations.manage', 'Manage Locations', 'إدارة المواقع', 'organization', 'Create and manage locations'),
  ('organization.subscription.view', 'View Subscription', 'عرض الاشتراك', 'organization', 'View subscription details'),
  ('organization.subscription.manage', 'Manage Subscription', 'إدارة الاشتراك', 'organization', 'Manage subscription and billing')
ON CONFLICT (code) DO NOTHING;

-- USER MANAGEMENT PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('users.create', 'Create Users', 'إنشاء مستخدمين', 'users', 'Create new users'),
  ('users.read', 'View Users', 'عرض المستخدمين', 'users', 'View user list and details'),
  ('users.update', 'Update Users', 'تعديل المستخدمين', 'users', 'Update user details'),
  ('users.delete', 'Delete Users', 'حذف المستخدمين', 'users', 'Delete users'),
  ('users.invite', 'Invite Users', 'دعوة مستخدمين', 'users', 'Send user invitations'),
  ('users.roles.assign', 'Assign Roles', 'تعيين الأدوار', 'users', 'Assign roles to users'),
  ('users.roles.manage', 'Manage Roles', 'إدارة الأدوار', 'users', 'Create and manage custom roles')
ON CONFLICT (code) DO NOTHING;

-- JOB PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('jobs.create', 'Create Jobs', 'إنشاء وظائف', 'jobs', 'Create new job postings'),
  ('jobs.read', 'View Jobs', 'عرض الوظائف', 'jobs', 'View job listings'),
  ('jobs.read.own', 'View Own Jobs', 'عرض وظائفي', 'jobs', 'View only assigned jobs'),
  ('jobs.update', 'Update Jobs', 'تعديل الوظائف', 'jobs', 'Update job details'),
  ('jobs.update.own', 'Update Own Jobs', 'تعديل وظائفي', 'jobs', 'Update only assigned jobs'),
  ('jobs.delete', 'Delete Jobs', 'حذف الوظائف', 'jobs', 'Delete job postings'),
  ('jobs.publish', 'Publish Jobs', 'نشر الوظائف', 'jobs', 'Publish jobs to career page'),
  ('jobs.close', 'Close Jobs', 'إغلاق الوظائف', 'jobs', 'Close job postings'),
  ('jobs.archive', 'Archive Jobs', 'أرشفة الوظائف', 'jobs', 'Archive job postings'),
  ('jobs.requisition.create', 'Create Job Requisition', 'إنشاء طلب وظيفة', 'jobs', 'Create job requisition for approval'),
  ('jobs.requisition.approve', 'Approve Job Requisition', 'الموافقة على طلب الوظيفة', 'jobs', 'Approve or reject job requisitions')
ON CONFLICT (code) DO NOTHING;

-- CANDIDATE PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('candidates.create', 'Create Candidates', 'إنشاء مرشحين', 'candidates', 'Add new candidates'),
  ('candidates.read', 'View Candidates', 'عرض المرشحين', 'candidates', 'View candidate profiles'),
  ('candidates.read.own', 'View Own Candidates', 'عرض مرشحيني', 'candidates', 'View only assigned candidates'),
  ('candidates.update', 'Update Candidates', 'تعديل المرشحين', 'candidates', 'Update candidate details'),
  ('candidates.delete', 'Delete Candidates', 'حذف المرشحين', 'candidates', 'Delete candidates'),
  ('candidates.export', 'Export Candidates', 'تصدير المرشحين', 'candidates', 'Export candidate data'),
  ('candidates.import', 'Import Candidates', 'استيراد المرشحين', 'candidates', 'Import candidates from file'),
  ('candidates.bulk.manage', 'Bulk Actions', 'إجراءات جماعية', 'candidates', 'Perform bulk actions on candidates'),
  ('candidates.notes.create', 'Add Notes', 'إضافة ملاحظات', 'candidates', 'Add notes to candidates'),
  ('candidates.notes.read', 'View Notes', 'عرض الملاحظات', 'candidates', 'View candidate notes'),
  ('candidates.tags.manage', 'Manage Tags', 'إدارة الوسوم', 'candidates', 'Add/remove candidate tags')
ON CONFLICT (code) DO NOTHING;

-- APPLICATION PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('applications.read', 'View Applications', 'عرض الطلبات', 'applications', 'View all applications'),
  ('applications.read.own', 'View Own Applications', 'عرض طلباتي', 'applications', 'View only assigned applications'),
  ('applications.update', 'Update Applications', 'تعديل الطلبات', 'applications', 'Update application details'),
  ('applications.stage.move', 'Move Stage', 'نقل المرحلة', 'applications', 'Move applications between stages'),
  ('applications.reject', 'Reject Applications', 'رفض الطلبات', 'applications', 'Reject applications'),
  ('applications.shortlist', 'Shortlist Applications', 'القائمة المختصرة', 'applications', 'Add to shortlist'),
  ('applications.assign', 'Assign Applications', 'تعيين الطلبات', 'applications', 'Assign applications to recruiters'),
  ('applications.score', 'Score Applications', 'تقييم الطلبات', 'applications', 'View and use AI scoring'),
  ('applications.bulk.manage', 'Bulk Actions', 'إجراءات جماعية', 'applications', 'Perform bulk actions')
ON CONFLICT (code) DO NOTHING;

-- INTERVIEW PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('interviews.create', 'Schedule Interviews', 'جدولة المقابلات', 'interviews', 'Schedule new interviews'),
  ('interviews.read', 'View Interviews', 'عرض المقابلات', 'interviews', 'View all interviews'),
  ('interviews.read.own', 'View Own Interviews', 'عرض مقابلاتي', 'interviews', 'View only assigned interviews'),
  ('interviews.update', 'Update Interviews', 'تعديل المقابلات', 'interviews', 'Update interview details'),
  ('interviews.cancel', 'Cancel Interviews', 'إلغاء المقابلات', 'interviews', 'Cancel scheduled interviews'),
  ('interviews.reschedule', 'Reschedule Interviews', 'إعادة جدولة المقابلات', 'interviews', 'Reschedule interviews'),
  ('interviews.scorecard.submit', 'Submit Scorecard', 'تقديم بطاقة التقييم', 'interviews', 'Submit interview scorecard'),
  ('interviews.scorecard.view', 'View Scorecards', 'عرض بطاقات التقييم', 'interviews', 'View all scorecards'),
  ('interviews.feedback.submit', 'Submit Feedback', 'تقديم الملاحظات', 'interviews', 'Submit interview feedback'),
  ('interviews.feedback.view', 'View Feedback', 'عرض الملاحظات', 'interviews', 'View all feedback')
ON CONFLICT (code) DO NOTHING;

-- OFFER PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('offers.create', 'Create Offers', 'إنشاء عروض', 'offers', 'Create job offers'),
  ('offers.read', 'View Offers', 'عرض العروض', 'offers', 'View all offers'),
  ('offers.read.own', 'View Own Offers', 'عرض عروضي', 'offers', 'View only own offers'),
  ('offers.update', 'Update Offers', 'تعديل العروض', 'offers', 'Update offer details'),
  ('offers.approve', 'Approve Offers', 'الموافقة على العروض', 'offers', 'Approve offers in workflow'),
  ('offers.send', 'Send Offers', 'إرسال العروض', 'offers', 'Send offers to candidates'),
  ('offers.rescind', 'Rescind Offers', 'سحب العروض', 'offers', 'Rescind sent offers'),
  ('offers.templates.manage', 'Manage Offer Templates', 'إدارة قوالب العروض', 'offers', 'Create and manage offer templates')
ON CONFLICT (code) DO NOTHING;

-- PIPELINE & WORKFLOW PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('pipelines.create', 'Create Pipelines', 'إنشاء مسارات', 'workflows', 'Create hiring pipelines'),
  ('pipelines.read', 'View Pipelines', 'عرض المسارات', 'workflows', 'View pipelines'),
  ('pipelines.update', 'Update Pipelines', 'تعديل المسارات', 'workflows', 'Update pipeline stages'),
  ('pipelines.delete', 'Delete Pipelines', 'حذف المسارات', 'workflows', 'Delete pipelines'),
  ('workflows.create', 'Create Workflows', 'إنشاء الإجراءات', 'workflows', 'Create automated workflows'),
  ('workflows.read', 'View Workflows', 'عرض الإجراءات', 'workflows', 'View workflows'),
  ('workflows.update', 'Update Workflows', 'تعديل الإجراءات', 'workflows', 'Update workflow rules'),
  ('workflows.delete', 'Delete Workflows', 'حذف الإجراءات', 'workflows', 'Delete workflows'),
  ('workflows.execute', 'Execute Workflows', 'تنفيذ الإجراءات', 'workflows', 'Manually trigger workflows')
ON CONFLICT (code) DO NOTHING;

-- EMAIL & COMMUNICATION PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('emails.send', 'Send Emails', 'إرسال رسائل', 'communication', 'Send emails to candidates'),
  ('emails.templates.create', 'Create Email Templates', 'إنشاء قوالب البريد', 'communication', 'Create email templates'),
  ('emails.templates.read', 'View Email Templates', 'عرض قوالب البريد', 'communication', 'View email templates'),
  ('emails.templates.update', 'Update Email Templates', 'تعديل قوالب البريد', 'communication', 'Update email templates'),
  ('emails.templates.delete', 'Delete Email Templates', 'حذف قوالب البريد', 'communication', 'Delete email templates'),
  ('emails.config.manage', 'Manage Email Config', 'إدارة إعدادات البريد', 'communication', 'Manage SMTP/email settings')
ON CONFLICT (code) DO NOTHING;

-- ANALYTICS & REPORTING PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('analytics.dashboard.view', 'View Dashboard', 'عرض لوحة التحكم', 'analytics', 'View analytics dashboard'),
  ('analytics.reports.view', 'View Reports', 'عرض التقارير', 'analytics', 'View standard reports'),
  ('analytics.reports.create', 'Create Reports', 'إنشاء تقارير', 'analytics', 'Create custom reports'),
  ('analytics.reports.export', 'Export Reports', 'تصدير التقارير', 'analytics', 'Export reports to file'),
  ('analytics.reports.schedule', 'Schedule Reports', 'جدولة التقارير', 'analytics', 'Schedule automated reports')
ON CONFLICT (code) DO NOTHING;

-- COMPLIANCE PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('compliance.view', 'View Compliance', 'عرض الامتثال', 'compliance', 'View compliance dashboard'),
  ('compliance.configure', 'Configure Compliance', 'إعداد الامتثال', 'compliance', 'Configure compliance settings'),
  ('compliance.reports.view', 'View Compliance Reports', 'عرض تقارير الامتثال', 'compliance', 'View compliance reports'),
  ('compliance.reports.export', 'Export Compliance Reports', 'تصدير تقارير الامتثال', 'compliance', 'Export for government'),
  ('compliance.saudization.manage', 'Manage Saudization', 'إدارة التوطين السعودي', 'compliance', 'Manage Saudization tracking'),
  ('compliance.emiratization.manage', 'Manage Emiratization', 'إدارة التوطين الإماراتي', 'compliance', 'Manage Emiratization tracking')
ON CONFLICT (code) DO NOTHING;

-- DOCUMENT PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('documents.upload', 'Upload Documents', 'رفع المستندات', 'documents', 'Upload documents'),
  ('documents.read', 'View Documents', 'عرض المستندات', 'documents', 'View documents'),
  ('documents.delete', 'Delete Documents', 'حذف المستندات', 'documents', 'Delete documents'),
  ('documents.download', 'Download Documents', 'تحميل المستندات', 'documents', 'Download documents')
ON CONFLICT (code) DO NOTHING;

-- AUDIT PERMISSIONS
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('audit.logs.view', 'View Audit Logs', 'عرض سجلات التدقيق', 'audit', 'View audit logs'),
  ('audit.logs.export', 'Export Audit Logs', 'تصدير سجلات التدقيق', 'audit', 'Export audit logs')
ON CONFLICT (code) DO NOTHING;

-- CANDIDATE PORTAL PERMISSIONS (for candidate role)
INSERT INTO permissions (code, name, name_ar, category, description) VALUES
  ('portal.profile.read', 'View Own Profile', 'عرض ملفي الشخصي', 'portal', 'View own profile'),
  ('portal.profile.update', 'Update Own Profile', 'تعديل ملفي الشخصي', 'portal', 'Update own profile'),
  ('portal.applications.read', 'View Own Applications', 'عرض طلباتي', 'portal', 'View own applications'),
  ('portal.interviews.read', 'View Own Interviews', 'عرض مقابلاتي', 'portal', 'View own interviews'),
  ('portal.interviews.schedule', 'Self-Schedule Interviews', 'جدولة المقابلات ذاتياً', 'portal', 'Pick interview slots'),
  ('portal.offers.read', 'View Own Offers', 'عرض عروضي', 'portal', 'View own offers'),
  ('portal.offers.respond', 'Respond to Offers', 'الرد على العروض', 'portal', 'Accept/decline offers'),
  ('portal.documents.manage', 'Manage Own Documents', 'إدارة مستنداتي', 'portal', 'Upload/delete own documents')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- Helper function to assign permission to role
CREATE OR REPLACE FUNCTION assign_permission_to_role(p_role_code VARCHAR, p_permission_code VARCHAR)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_role_id UUID;
  v_permission_id UUID;
BEGIN
  SELECT id INTO v_role_id FROM roles WHERE code = p_role_code LIMIT 1;
  SELECT id INTO v_permission_id FROM permissions WHERE code = p_permission_code LIMIT 1;

  IF v_role_id IS NOT NULL AND v_permission_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_role_id, v_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END;
$$;

-- SUPER ADMIN: All permissions
DO $$
DECLARE
  perm RECORD;
BEGIN
  FOR perm IN SELECT code FROM permissions LOOP
    PERFORM assign_permission_to_role('super_admin', perm.code);
  END LOOP;
END $$;

-- ORG ADMIN: All except platform permissions
DO $$
DECLARE
  perm RECORD;
BEGIN
  FOR perm IN SELECT code FROM permissions WHERE category != 'platform' LOOP
    PERFORM assign_permission_to_role('org_admin', perm.code);
  END LOOP;
END $$;

-- HR MANAGER permissions
SELECT assign_permission_to_role('hr_manager', 'organization.settings.read');
SELECT assign_permission_to_role('hr_manager', 'organization.departments.manage');
SELECT assign_permission_to_role('hr_manager', 'organization.locations.manage');
SELECT assign_permission_to_role('hr_manager', 'users.read');
SELECT assign_permission_to_role('hr_manager', 'jobs.create');
SELECT assign_permission_to_role('hr_manager', 'jobs.read');
SELECT assign_permission_to_role('hr_manager', 'jobs.update');
SELECT assign_permission_to_role('hr_manager', 'jobs.publish');
SELECT assign_permission_to_role('hr_manager', 'jobs.close');
SELECT assign_permission_to_role('hr_manager', 'jobs.requisition.approve');
SELECT assign_permission_to_role('hr_manager', 'candidates.read');
SELECT assign_permission_to_role('hr_manager', 'candidates.update');
SELECT assign_permission_to_role('hr_manager', 'candidates.export');
SELECT assign_permission_to_role('hr_manager', 'candidates.notes.create');
SELECT assign_permission_to_role('hr_manager', 'candidates.notes.read');
SELECT assign_permission_to_role('hr_manager', 'applications.read');
SELECT assign_permission_to_role('hr_manager', 'applications.update');
SELECT assign_permission_to_role('hr_manager', 'applications.stage.move');
SELECT assign_permission_to_role('hr_manager', 'applications.reject');
SELECT assign_permission_to_role('hr_manager', 'applications.shortlist');
SELECT assign_permission_to_role('hr_manager', 'applications.assign');
SELECT assign_permission_to_role('hr_manager', 'applications.score');
SELECT assign_permission_to_role('hr_manager', 'interviews.create');
SELECT assign_permission_to_role('hr_manager', 'interviews.read');
SELECT assign_permission_to_role('hr_manager', 'interviews.update');
SELECT assign_permission_to_role('hr_manager', 'interviews.cancel');
SELECT assign_permission_to_role('hr_manager', 'interviews.scorecard.view');
SELECT assign_permission_to_role('hr_manager', 'interviews.feedback.view');
SELECT assign_permission_to_role('hr_manager', 'offers.read');
SELECT assign_permission_to_role('hr_manager', 'offers.approve');
SELECT assign_permission_to_role('hr_manager', 'offers.templates.manage');
SELECT assign_permission_to_role('hr_manager', 'pipelines.create');
SELECT assign_permission_to_role('hr_manager', 'pipelines.read');
SELECT assign_permission_to_role('hr_manager', 'pipelines.update');
SELECT assign_permission_to_role('hr_manager', 'pipelines.delete');
SELECT assign_permission_to_role('hr_manager', 'workflows.create');
SELECT assign_permission_to_role('hr_manager', 'workflows.read');
SELECT assign_permission_to_role('hr_manager', 'workflows.update');
SELECT assign_permission_to_role('hr_manager', 'workflows.delete');
SELECT assign_permission_to_role('hr_manager', 'emails.send');
SELECT assign_permission_to_role('hr_manager', 'emails.templates.create');
SELECT assign_permission_to_role('hr_manager', 'emails.templates.read');
SELECT assign_permission_to_role('hr_manager', 'emails.templates.update');
SELECT assign_permission_to_role('hr_manager', 'analytics.dashboard.view');
SELECT assign_permission_to_role('hr_manager', 'analytics.reports.view');
SELECT assign_permission_to_role('hr_manager', 'analytics.reports.create');
SELECT assign_permission_to_role('hr_manager', 'analytics.reports.export');
SELECT assign_permission_to_role('hr_manager', 'compliance.view');
SELECT assign_permission_to_role('hr_manager', 'compliance.configure');
SELECT assign_permission_to_role('hr_manager', 'compliance.reports.view');
SELECT assign_permission_to_role('hr_manager', 'compliance.reports.export');
SELECT assign_permission_to_role('hr_manager', 'documents.upload');
SELECT assign_permission_to_role('hr_manager', 'documents.read');
SELECT assign_permission_to_role('hr_manager', 'documents.download');
SELECT assign_permission_to_role('hr_manager', 'audit.logs.view');

-- RECRUITER permissions
SELECT assign_permission_to_role('recruiter', 'jobs.create');
SELECT assign_permission_to_role('recruiter', 'jobs.read');
SELECT assign_permission_to_role('recruiter', 'jobs.update.own');
SELECT assign_permission_to_role('recruiter', 'jobs.requisition.create');
SELECT assign_permission_to_role('recruiter', 'candidates.create');
SELECT assign_permission_to_role('recruiter', 'candidates.read');
SELECT assign_permission_to_role('recruiter', 'candidates.update');
SELECT assign_permission_to_role('recruiter', 'candidates.import');
SELECT assign_permission_to_role('recruiter', 'candidates.notes.create');
SELECT assign_permission_to_role('recruiter', 'candidates.notes.read');
SELECT assign_permission_to_role('recruiter', 'candidates.tags.manage');
SELECT assign_permission_to_role('recruiter', 'applications.read');
SELECT assign_permission_to_role('recruiter', 'applications.update');
SELECT assign_permission_to_role('recruiter', 'applications.stage.move');
SELECT assign_permission_to_role('recruiter', 'applications.reject');
SELECT assign_permission_to_role('recruiter', 'applications.shortlist');
SELECT assign_permission_to_role('recruiter', 'applications.score');
SELECT assign_permission_to_role('recruiter', 'applications.bulk.manage');
SELECT assign_permission_to_role('recruiter', 'interviews.create');
SELECT assign_permission_to_role('recruiter', 'interviews.read');
SELECT assign_permission_to_role('recruiter', 'interviews.update');
SELECT assign_permission_to_role('recruiter', 'interviews.cancel');
SELECT assign_permission_to_role('recruiter', 'interviews.reschedule');
SELECT assign_permission_to_role('recruiter', 'interviews.scorecard.submit');
SELECT assign_permission_to_role('recruiter', 'interviews.feedback.submit');
SELECT assign_permission_to_role('recruiter', 'offers.create');
SELECT assign_permission_to_role('recruiter', 'offers.read');
SELECT assign_permission_to_role('recruiter', 'offers.update');
SELECT assign_permission_to_role('recruiter', 'offers.send');
SELECT assign_permission_to_role('recruiter', 'pipelines.read');
SELECT assign_permission_to_role('recruiter', 'workflows.read');
SELECT assign_permission_to_role('recruiter', 'emails.send');
SELECT assign_permission_to_role('recruiter', 'emails.templates.read');
SELECT assign_permission_to_role('recruiter', 'analytics.dashboard.view');
SELECT assign_permission_to_role('recruiter', 'analytics.reports.view');
SELECT assign_permission_to_role('recruiter', 'documents.upload');
SELECT assign_permission_to_role('recruiter', 'documents.read');
SELECT assign_permission_to_role('recruiter', 'documents.download');

-- HIRING MANAGER permissions
SELECT assign_permission_to_role('hiring_manager', 'jobs.read');
SELECT assign_permission_to_role('hiring_manager', 'jobs.requisition.create');
SELECT assign_permission_to_role('hiring_manager', 'jobs.requisition.approve');
SELECT assign_permission_to_role('hiring_manager', 'candidates.read.own');
SELECT assign_permission_to_role('hiring_manager', 'candidates.notes.create');
SELECT assign_permission_to_role('hiring_manager', 'candidates.notes.read');
SELECT assign_permission_to_role('hiring_manager', 'applications.read.own');
SELECT assign_permission_to_role('hiring_manager', 'applications.shortlist');
SELECT assign_permission_to_role('hiring_manager', 'applications.reject');
SELECT assign_permission_to_role('hiring_manager', 'interviews.read.own');
SELECT assign_permission_to_role('hiring_manager', 'interviews.scorecard.submit');
SELECT assign_permission_to_role('hiring_manager', 'interviews.scorecard.view');
SELECT assign_permission_to_role('hiring_manager', 'interviews.feedback.submit');
SELECT assign_permission_to_role('hiring_manager', 'interviews.feedback.view');
SELECT assign_permission_to_role('hiring_manager', 'offers.read.own');
SELECT assign_permission_to_role('hiring_manager', 'offers.approve');
SELECT assign_permission_to_role('hiring_manager', 'analytics.dashboard.view');
SELECT assign_permission_to_role('hiring_manager', 'documents.read');
SELECT assign_permission_to_role('hiring_manager', 'documents.download');

-- CANDIDATE permissions (portal only)
SELECT assign_permission_to_role('candidate', 'portal.profile.read');
SELECT assign_permission_to_role('candidate', 'portal.profile.update');
SELECT assign_permission_to_role('candidate', 'portal.applications.read');
SELECT assign_permission_to_role('candidate', 'portal.interviews.read');
SELECT assign_permission_to_role('candidate', 'portal.interviews.schedule');
SELECT assign_permission_to_role('candidate', 'portal.offers.read');
SELECT assign_permission_to_role('candidate', 'portal.offers.respond');
SELECT assign_permission_to_role('candidate', 'portal.documents.manage');

-- Clean up helper function
DROP FUNCTION IF EXISTS assign_permission_to_role(VARCHAR, VARCHAR);

-- =====================================================
-- 4. SUMMARY
-- =====================================================
-- Total roles: 6
-- Total permissions: 85+
-- Role assignments complete
