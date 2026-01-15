-- =============================================
-- JADARAT ATS - Super Admin Features
-- Phase 3: Audit Logs, Platform Settings, Email Templates
-- =============================================

-- 1. Create audit_logs table for tracking all admin actions
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_org ON public.audit_logs(org_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 2. Create platform_settings table for global platform configuration
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_settings_key ON public.platform_settings(key);
CREATE INDEX idx_platform_settings_category ON public.platform_settings(category);

-- 3. Create email_templates table for system email templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  subject_ar VARCHAR(255),
  body_html TEXT NOT NULL,
  body_html_ar TEXT,
  body_text TEXT,
  body_text_ar TEXT,
  variables JSONB DEFAULT '[]',
  category VARCHAR(50) DEFAULT 'general',
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

CREATE INDEX idx_email_templates_org ON public.email_templates(org_id);
CREATE INDEX idx_email_templates_slug ON public.email_templates(slug);
CREATE INDEX idx_email_templates_category ON public.email_templates(category);

-- 4. Create analytics_snapshots table for historical data
CREATE TABLE public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, snapshot_date)
);

CREATE INDEX idx_analytics_snapshots_org ON public.analytics_snapshots(org_id);
CREATE INDEX idx_analytics_snapshots_date ON public.analytics_snapshots(snapshot_date);

-- Platform-wide snapshots (org_id is NULL)
CREATE TABLE public.platform_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  total_organizations INTEGER DEFAULT 0,
  active_organizations INTEGER DEFAULT 0,
  trial_organizations INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  total_candidates INTEGER DEFAULT 0,
  total_applications INTEGER DEFAULT 0,
  mrr DECIMAL(12,2) DEFAULT 0,
  arr DECIMAL(12,2) DEFAULT 0,
  new_organizations INTEGER DEFAULT 0,
  churned_organizations INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_analytics_date ON public.platform_analytics_snapshots(snapshot_date DESC);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- AUDIT_LOGS POLICIES
CREATE POLICY "Super admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can view their org audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    AND public.has_role(auth.uid(), 'org_admin')
  );

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- PLATFORM_SETTINGS POLICIES
CREATE POLICY "Anyone can view public settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (is_public = true OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage platform settings"
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- EMAIL_TEMPLATES POLICIES
CREATE POLICY "Users can view email templates in their org"
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (
    org_id IS NULL AND is_system = true
    OR org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Super admins can manage system templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage their org templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    AND public.has_role(auth.uid(), 'org_admin')
    AND is_system = false
  )
  WITH CHECK (
    org_id = public.get_user_org_id(auth.uid())
    AND public.has_role(auth.uid(), 'org_admin')
    AND is_system = false
  );

-- ANALYTICS_SNAPSHOTS POLICIES
CREATE POLICY "Users can view their org analytics"
  ON public.analytics_snapshots FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "System can manage analytics snapshots"
  ON public.analytics_snapshots FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- PLATFORM_ANALYTICS_SNAPSHOTS POLICIES
CREATE POLICY "Super admins can view platform analytics"
  ON public.platform_analytics_snapshots FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "System can manage platform analytics"
  ON public.platform_analytics_snapshots FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- HELPER FUNCTION FOR AUDIT LOGGING
-- =============================================

CREATE OR REPLACE FUNCTION public.log_audit(
  _action VARCHAR(100),
  _entity_type VARCHAR(50),
  _entity_id UUID DEFAULT NULL,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  _log_id UUID;
  _user_org_id UUID;
BEGIN
  SELECT org_id INTO _user_org_id FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.audit_logs (
    user_id, org_id, action, entity_type, entity_id,
    old_values, new_values, metadata
  )
  VALUES (
    auth.uid(), _user_org_id, _action, _entity_type, _entity_id,
    _old_values, _new_values, _metadata
  )
  RETURNING id INTO _log_id;

  RETURN _log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- SEED DEFAULT PLATFORM SETTINGS
-- =============================================

INSERT INTO public.platform_settings (key, value, description, category, is_public) VALUES
  ('app_name', '"Jadarat ATS"', 'Application name in English', 'general', true),
  ('app_name_ar', '"جدارات"', 'Application name in Arabic', 'general', true),
  ('support_email', '"support@jadarat.io"', 'Support email address', 'general', true),
  ('default_language', '"en"', 'Default platform language', 'general', true),
  ('default_timezone', '"Asia/Riyadh"', 'Default platform timezone', 'general', true),
  ('session_timeout_minutes', '30', 'Session timeout in minutes', 'security', false),
  ('max_login_attempts', '5', 'Maximum login attempts before lockout', 'security', false),
  ('enforce_strong_password', 'true', 'Require strong passwords', 'security', false),
  ('require_2fa_admins', 'false', 'Require 2FA for admin accounts', 'security', false),
  ('email_notifications_enabled', 'true', 'Enable email notifications', 'notifications', false),
  ('ai_provider', '"openai"', 'AI service provider', 'ai', false),
  ('ai_resume_parsing_enabled', 'true', 'Enable AI resume parsing', 'ai', false),
  ('ai_candidate_scoring_enabled', 'true', 'Enable AI candidate scoring', 'ai', false),
  ('maintenance_mode', 'false', 'Platform maintenance mode', 'system', true)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- SEED DEFAULT SYSTEM EMAIL TEMPLATES
-- =============================================

INSERT INTO public.email_templates (org_id, name, slug, subject, subject_ar, body_html, body_html_ar, variables, category, is_system, is_active) VALUES
  (NULL, 'Welcome Email', 'welcome', 'Welcome to {{app_name}}!', 'مرحباً بك في {{app_name}}!',
   '<h1>Welcome, {{first_name}}!</h1><p>Thank you for joining {{app_name}}. We''re excited to have you on board.</p><p>Get started by exploring your dashboard and setting up your profile.</p><p>Best regards,<br>The {{app_name}} Team</p>',
   '<h1>مرحباً {{first_name}}!</h1><p>شكراً لانضمامك إلى {{app_name}}. نحن سعداء بوجودك معنا.</p><p>ابدأ باستكشاف لوحة التحكم وإعداد ملفك الشخصي.</p><p>مع أطيب التحيات،<br>فريق {{app_name}}</p>',
   '["first_name", "app_name", "login_url"]', 'onboarding', true, true),

  (NULL, 'Password Reset', 'password-reset', 'Reset Your Password', 'إعادة تعيين كلمة المرور',
   '<h1>Password Reset Request</h1><p>Hi {{first_name}},</p><p>We received a request to reset your password. Click the button below to create a new password:</p><p><a href="{{reset_url}}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a></p><p>If you didn''t request this, you can safely ignore this email.</p><p>This link will expire in 1 hour.</p>',
   '<h1>طلب إعادة تعيين كلمة المرور</h1><p>مرحباً {{first_name}}،</p><p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة:</p><p><a href="{{reset_url}}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">إعادة تعيين كلمة المرور</a></p><p>إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد الإلكتروني بأمان.</p><p>ستنتهي صلاحية هذا الرابط خلال ساعة واحدة.</p>',
   '["first_name", "reset_url"]', 'auth', true, true),

  (NULL, 'Application Received', 'application-received', 'Application Received for {{job_title}}', 'تم استلام طلبك لوظيفة {{job_title}}',
   '<h1>Thank You for Applying!</h1><p>Dear {{candidate_name}},</p><p>We have received your application for the <strong>{{job_title}}</strong> position at {{company_name}}.</p><p>Our team will review your application and get back to you soon.</p><p>Application ID: {{application_id}}</p><p>Best regards,<br>{{company_name}} Recruitment Team</p>',
   '<h1>شكراً لتقديمك!</h1><p>عزيزي/عزيزتي {{candidate_name}}،</p><p>لقد استلمنا طلبك لوظيفة <strong>{{job_title}}</strong> في {{company_name}}.</p><p>سيقوم فريقنا بمراجعة طلبك والتواصل معك قريباً.</p><p>رقم الطلب: {{application_id}}</p><p>مع أطيب التحيات،<br>فريق التوظيف في {{company_name}}</p>',
   '["candidate_name", "job_title", "company_name", "application_id"]', 'applications', true, true),

  (NULL, 'Interview Invitation', 'interview-invitation', 'Interview Invitation - {{job_title}}', 'دعوة مقابلة - {{job_title}}',
   '<h1>Interview Invitation</h1><p>Dear {{candidate_name}},</p><p>We are pleased to invite you for an interview for the <strong>{{job_title}}</strong> position.</p><p><strong>Details:</strong></p><ul><li>Date: {{interview_date}}</li><li>Time: {{interview_time}}</li><li>Type: {{interview_type}}</li><li>Location/Link: {{interview_location}}</li></ul><p>Please confirm your attendance by clicking the button below:</p><p><a href="{{confirm_url}}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Confirm Attendance</a></p><p>Best regards,<br>{{company_name}} Recruitment Team</p>',
   '<h1>دعوة مقابلة</h1><p>عزيزي/عزيزتي {{candidate_name}}،</p><p>يسرنا دعوتك لإجراء مقابلة لوظيفة <strong>{{job_title}}</strong>.</p><p><strong>التفاصيل:</strong></p><ul><li>التاريخ: {{interview_date}}</li><li>الوقت: {{interview_time}}</li><li>النوع: {{interview_type}}</li><li>المكان/الرابط: {{interview_location}}</li></ul><p>يرجى تأكيد حضورك بالنقر على الزر أدناه:</p><p><a href="{{confirm_url}}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">تأكيد الحضور</a></p><p>مع أطيب التحيات،<br>فريق التوظيف في {{company_name}}</p>',
   '["candidate_name", "job_title", "company_name", "interview_date", "interview_time", "interview_type", "interview_location", "confirm_url"]', 'interviews', true, true),

  (NULL, 'Offer Letter', 'offer-letter', 'Job Offer - {{job_title}} at {{company_name}}', 'عرض وظيفي - {{job_title}} في {{company_name}}',
   '<h1>Congratulations!</h1><p>Dear {{candidate_name}},</p><p>We are delighted to extend an offer for the position of <strong>{{job_title}}</strong> at {{company_name}}.</p><p><strong>Offer Details:</strong></p><ul><li>Position: {{job_title}}</li><li>Department: {{department}}</li><li>Start Date: {{start_date}}</li><li>Salary: {{salary}}</li></ul><p>Please review the attached offer letter and respond by {{response_deadline}}.</p><p><a href="{{accept_url}}" style="background-color: #34a853; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Accept Offer</a></p><p>We look forward to welcoming you to our team!</p><p>Best regards,<br>{{company_name}} HR Team</p>',
   '<h1>تهانينا!</h1><p>عزيزي/عزيزتي {{candidate_name}}،</p><p>يسعدنا أن نقدم لك عرضاً لشغل منصب <strong>{{job_title}}</strong> في {{company_name}}.</p><p><strong>تفاصيل العرض:</strong></p><ul><li>المنصب: {{job_title}}</li><li>القسم: {{department}}</li><li>تاريخ البدء: {{start_date}}</li><li>الراتب: {{salary}}</li></ul><p>يرجى مراجعة خطاب العرض المرفق والرد بحلول {{response_deadline}}.</p><p><a href="{{accept_url}}" style="background-color: #34a853; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">قبول العرض</a></p><p>نتطلع إلى الترحيب بك في فريقنا!</p><p>مع أطيب التحيات،<br>فريق الموارد البشرية في {{company_name}}</p>',
   '["candidate_name", "job_title", "company_name", "department", "start_date", "salary", "response_deadline", "accept_url"]', 'offers', true, true),

  (NULL, 'Application Rejected', 'application-rejected', 'Update on Your Application - {{job_title}}', 'تحديث بشأن طلبك - {{job_title}}',
   '<h1>Application Update</h1><p>Dear {{candidate_name}},</p><p>Thank you for your interest in the <strong>{{job_title}}</strong> position at {{company_name}} and for taking the time to apply.</p><p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p><p>We appreciate your interest in joining our team and encourage you to apply for future positions that match your skills and experience.</p><p>We wish you the best in your job search.</p><p>Best regards,<br>{{company_name}} Recruitment Team</p>',
   '<h1>تحديث الطلب</h1><p>عزيزي/عزيزتي {{candidate_name}}،</p><p>شكراً لاهتمامك بوظيفة <strong>{{job_title}}</strong> في {{company_name}} ولأخذك الوقت للتقديم.</p><p>بعد دراسة متأنية، قررنا المضي قدماً مع مرشحين آخرين تتوافق مؤهلاتهم بشكل أكبر مع احتياجاتنا الحالية.</p><p>نقدر اهتمامك بالانضمام إلى فريقنا ونشجعك على التقدم للوظائف المستقبلية التي تتناسب مع مهاراتك وخبراتك.</p><p>نتمنى لك التوفيق في بحثك عن عمل.</p><p>مع أطيب التحيات،<br>فريق التوظيف في {{company_name}}</p>',
   '["candidate_name", "job_title", "company_name"]', 'applications', true, true)
ON CONFLICT (org_id, slug) DO NOTHING;
