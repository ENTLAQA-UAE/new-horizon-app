-- Notification Settings System
-- Comprehensive notification management for organizations

-- Notification event types (master list)
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  category VARCHAR(50) NOT NULL, -- user, recruitment, interview, offer, job
  default_channels TEXT[] DEFAULT ARRAY['mail'],
  available_variables JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT false, -- true for built-in events
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization notification settings (per event configuration)
CREATE TABLE IF NOT EXISTS org_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES notification_events(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  channels TEXT[] DEFAULT ARRAY['mail'], -- 'mail', 'system', 'sms'
  audience_roles TEXT[] DEFAULT ARRAY[], -- roles that receive this notification
  audience_users UUID[] DEFAULT ARRAY[], -- specific users
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, event_id)
);

-- Organization email templates (customizable per event)
CREATE TABLE IF NOT EXISTS org_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES notification_events(id) ON DELETE CASCADE,
  subject VARCHAR(500) NOT NULL,
  subject_ar VARCHAR(500),
  body_html TEXT NOT NULL,
  body_html_ar TEXT,
  body_text TEXT, -- plain text fallback
  body_text_ar TEXT,
  include_logo BOOLEAN DEFAULT true,
  include_footer BOOLEAN DEFAULT true,
  custom_variables JSONB DEFAULT '{}', -- org-specific variable overrides
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, event_id)
);

-- Default email templates (system-wide defaults)
CREATE TABLE IF NOT EXISTS default_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES notification_events(id) ON DELETE CASCADE UNIQUE,
  subject VARCHAR(500) NOT NULL,
  subject_ar VARCHAR(500),
  body_html TEXT NOT NULL,
  body_html_ar TEXT,
  body_text TEXT,
  body_text_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification log (for tracking sent notifications)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  event_id UUID REFERENCES notification_events(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255),
  channel VARCHAR(20) NOT NULL, -- mail, system, sms
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, failed, delivered, opened
  subject VARCHAR(500),
  body_preview TEXT,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_notification_settings_org ON org_notification_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_org_notification_settings_event ON org_notification_settings(event_id);
CREATE INDEX IF NOT EXISTS idx_org_email_templates_org ON org_email_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_org_email_templates_event ON org_email_templates(event_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_org ON notification_log(org_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_recipient ON notification_log(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_created ON notification_log(created_at DESC);

-- Enable RLS
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- notification_events - public read
CREATE POLICY "Anyone can view notification events"
ON notification_events FOR SELECT USING (true);

-- org_notification_settings
CREATE POLICY "Users can view their org notification settings"
ON org_notification_settings FOR SELECT
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage org notification settings"
ON org_notification_settings FOR ALL
USING (org_id IN (
  SELECT org_id FROM profiles
  WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin')
));

-- org_email_templates
CREATE POLICY "Users can view their org email templates"
ON org_email_templates FOR SELECT
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage org email templates"
ON org_email_templates FOR ALL
USING (org_id IN (
  SELECT org_id FROM profiles
  WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin')
));

-- default_email_templates - public read for all, super_admin write
CREATE POLICY "Anyone can view default templates"
ON default_email_templates FOR SELECT USING (true);

CREATE POLICY "Super admins can manage default templates"
ON default_email_templates FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
));

-- notification_log
CREATE POLICY "Users can view their org notification logs"
ON notification_log FOR SELECT
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System can insert notification logs"
ON notification_log FOR INSERT WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS org_notification_settings_updated_at ON org_notification_settings;
CREATE TRIGGER org_notification_settings_updated_at
  BEFORE UPDATE ON org_notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_notification_updated_at();

DROP TRIGGER IF EXISTS org_email_templates_updated_at ON org_email_templates;
CREATE TRIGGER org_email_templates_updated_at
  BEFORE UPDATE ON org_email_templates
  FOR EACH ROW EXECUTE FUNCTION update_notification_updated_at();

-- Insert default notification events
INSERT INTO notification_events (code, name, name_ar, description, category, default_channels, available_variables, is_system) VALUES
-- User Management
('user_invited', 'User Invitation', 'دعوة مستخدم', 'Sent when a team member is invited to the organization', 'user', ARRAY['mail'],
 '[{"key": "receiver_name", "label": "Recipient Name"}, {"key": "inviter_name", "label": "Inviter Name"}, {"key": "org_name", "label": "Organization Name"}, {"key": "invitation_url", "label": "Invitation URL"}, {"key": "role", "label": "Assigned Role"}]', true),

('user_joined', 'User Joined', 'انضمام مستخدم', 'Sent when a new team member joins', 'user', ARRAY['mail', 'system'],
 '[{"key": "user_name", "label": "User Name"}, {"key": "user_email", "label": "User Email"}, {"key": "role", "label": "Role"}, {"key": "org_name", "label": "Organization Name"}]', true),

('password_reset', 'Password Reset', 'إعادة تعيين كلمة المرور', 'Sent when user requests password reset', 'user', ARRAY['mail'],
 '[{"key": "user_name", "label": "User Name"}, {"key": "reset_url", "label": "Reset URL"}, {"key": "expiry_time", "label": "Link Expiry"}]', true),

('role_changed', 'Role Changed', 'تغيير الدور', 'Sent when user role is updated', 'user', ARRAY['mail', 'system'],
 '[{"key": "user_name", "label": "User Name"}, {"key": "old_role", "label": "Previous Role"}, {"key": "new_role", "label": "New Role"}, {"key": "changed_by", "label": "Changed By"}]', true),

-- Recruitment
('new_application', 'New Application', 'طلب توظيف جديد', 'Sent when a candidate applies for a job', 'recruitment', ARRAY['mail', 'system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "application_date", "label": "Application Date"}, {"key": "application_url", "label": "Application URL"}]', true),

('application_received', 'Application Received', 'تم استلام الطلب', 'Confirmation sent to candidate after applying', 'recruitment', ARRAY['mail'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "org_name", "label": "Organization Name"}, {"key": "portal_url", "label": "Portal URL"}]', true),

('candidate_stage_moved', 'Candidate Stage Changed', 'تغيير مرحلة المرشح', 'Sent when candidate moves to a new pipeline stage', 'recruitment', ARRAY['system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "old_stage", "label": "Previous Stage"}, {"key": "new_stage", "label": "New Stage"}, {"key": "moved_by", "label": "Moved By"}]', true),

('candidate_disqualified', 'Candidate Disqualified', 'استبعاد المرشح', 'Sent when a candidate is disqualified', 'recruitment', ARRAY['mail', 'system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "reason", "label": "Disqualification Reason"}, {"key": "disqualified_by", "label": "Disqualified By"}]', true),

('candidate_rejection', 'Candidate Rejection Email', 'بريد رفض المرشح', 'Rejection email sent to candidate', 'recruitment', ARRAY['mail'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "org_name", "label": "Organization Name"}]', true),

-- Interviews
('interview_scheduled', 'Interview Scheduled', 'موعد مقابلة', 'Sent when an interview is scheduled', 'interview', ARRAY['mail', 'system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "interview_date", "label": "Interview Date"}, {"key": "interview_time", "label": "Interview Time"}, {"key": "interview_type", "label": "Interview Type"}, {"key": "location", "label": "Location/Link"}, {"key": "interviewers", "label": "Interviewers"}]', true),

('interview_reminder', 'Interview Reminder', 'تذكير بالمقابلة', 'Reminder sent before interview', 'interview', ARRAY['mail', 'system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "interview_date", "label": "Interview Date"}, {"key": "interview_time", "label": "Interview Time"}, {"key": "location", "label": "Location/Link"}]', true),

('interview_cancelled', 'Interview Cancelled', 'إلغاء المقابلة', 'Sent when interview is cancelled', 'interview', ARRAY['mail', 'system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "interview_date", "label": "Original Date"}, {"key": "cancelled_by", "label": "Cancelled By"}, {"key": "reason", "label": "Reason"}]', true),

('interview_rescheduled', 'Interview Rescheduled', 'إعادة جدولة المقابلة', 'Sent when interview is rescheduled', 'interview', ARRAY['mail', 'system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "old_date", "label": "Original Date"}, {"key": "new_date", "label": "New Date"}, {"key": "new_time", "label": "New Time"}]', true),

('scorecard_submitted', 'Scorecard Submitted', 'تقديم بطاقة التقييم', 'Sent when interviewer submits scorecard', 'interview', ARRAY['system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "interviewer_name", "label": "Interviewer"}, {"key": "rating", "label": "Overall Rating"}, {"key": "recommendation", "label": "Recommendation"}]', true),

('scorecard_reminder', 'Scorecard Reminder', 'تذكير ببطاقة التقييم', 'Reminder to submit scorecard after interview', 'interview', ARRAY['mail', 'system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "interview_date", "label": "Interview Date"}, {"key": "scorecard_url", "label": "Scorecard URL"}]', true),

-- Offers
('offer_created', 'Offer Created', 'إنشاء عرض', 'Sent when an offer is created for a candidate', 'offer', ARRAY['system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "salary", "label": "Salary"}, {"key": "start_date", "label": "Start Date"}, {"key": "created_by", "label": "Created By"}]', true),

('offer_sent', 'Offer Sent to Candidate', 'إرسال العرض للمرشح', 'Offer letter sent to candidate', 'offer', ARRAY['mail'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "org_name", "label": "Organization Name"}, {"key": "offer_url", "label": "Offer URL"}, {"key": "expiry_date", "label": "Expiry Date"}]', true),

('offer_accepted', 'Offer Accepted', 'قبول العرض', 'Sent when candidate accepts offer', 'offer', ARRAY['mail', 'system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "start_date", "label": "Start Date"}]', true),

('offer_rejected', 'Offer Rejected', 'رفض العرض', 'Sent when candidate rejects offer', 'offer', ARRAY['mail', 'system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "reason", "label": "Rejection Reason"}]', true),

('offer_expired', 'Offer Expired', 'انتهاء صلاحية العرض', 'Sent when offer expires without response', 'offer', ARRAY['system'],
 '[{"key": "candidate_name", "label": "Candidate Name"}, {"key": "job_title", "label": "Job Title"}, {"key": "expiry_date", "label": "Expiry Date"}]', true),

-- Jobs
('job_published', 'Job Published', 'نشر وظيفة', 'Sent when a job is published', 'job', ARRAY['system'],
 '[{"key": "job_title", "label": "Job Title"}, {"key": "department", "label": "Department"}, {"key": "published_by", "label": "Published By"}, {"key": "job_url", "label": "Job URL"}]', true),

('job_closed', 'Job Closed', 'إغلاق وظيفة', 'Sent when a job posting is closed', 'job', ARRAY['system'],
 '[{"key": "job_title", "label": "Job Title"}, {"key": "total_applications", "label": "Total Applications"}, {"key": "closed_by", "label": "Closed By"}]', true),

('job_expiring', 'Job Expiring Soon', 'الوظيفة ستنتهي قريباً', 'Reminder that job posting will expire soon', 'job', ARRAY['mail', 'system'],
 '[{"key": "job_title", "label": "Job Title"}, {"key": "expiry_date", "label": "Expiry Date"}, {"key": "days_remaining", "label": "Days Remaining"}]', true),

-- Requisitions
('requisition_created', 'Requisition Created', 'إنشاء طلب توظيف', 'Sent when new requisition is created', 'job', ARRAY['system'],
 '[{"key": "job_title", "label": "Job Title"}, {"key": "department", "label": "Department"}, {"key": "requested_by", "label": "Requested By"}, {"key": "positions", "label": "Number of Positions"}]', true),

('requisition_approved', 'Requisition Approved', 'الموافقة على طلب التوظيف', 'Sent when requisition is approved', 'job', ARRAY['mail', 'system'],
 '[{"key": "job_title", "label": "Job Title"}, {"key": "approved_by", "label": "Approved By"}, {"key": "requester_name", "label": "Requester"}]', true),

('requisition_rejected', 'Requisition Rejected', 'رفض طلب التوظيف', 'Sent when requisition is rejected', 'job', ARRAY['mail', 'system'],
 '[{"key": "job_title", "label": "Job Title"}, {"key": "rejected_by", "label": "Rejected By"}, {"key": "reason", "label": "Rejection Reason"}, {"key": "requester_name", "label": "Requester"}]', true)

ON CONFLICT (code) DO NOTHING;

-- Insert default email templates for key events
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT
  id,
  CASE code
    WHEN 'user_invited' THEN 'You''ve been invited to join {org_name}'
    WHEN 'password_reset' THEN 'Reset your password - {org_name}'
    WHEN 'application_received' THEN 'Application received for {job_title}'
    WHEN 'interview_scheduled' THEN 'Interview scheduled for {job_title}'
    WHEN 'interview_reminder' THEN 'Reminder: Interview tomorrow for {job_title}'
    WHEN 'offer_sent' THEN 'Offer letter from {org_name}'
    WHEN 'offer_accepted' THEN 'Congratulations! {candidate_name} accepted the offer'
    ELSE name
  END as subject,
  CASE code
    WHEN 'user_invited' THEN 'دعوة للانضمام إلى {org_name}'
    WHEN 'password_reset' THEN 'إعادة تعيين كلمة المرور - {org_name}'
    WHEN 'application_received' THEN 'تم استلام طلبك لوظيفة {job_title}'
    WHEN 'interview_scheduled' THEN 'تم تحديد موعد المقابلة لوظيفة {job_title}'
    WHEN 'interview_reminder' THEN 'تذكير: مقابلة غداً لوظيفة {job_title}'
    WHEN 'offer_sent' THEN 'عرض وظيفي من {org_name}'
    WHEN 'offer_accepted' THEN 'تهانينا! قبل {candidate_name} العرض'
    ELSE name_ar
  END as subject_ar,
  CASE code
    WHEN 'user_invited' THEN '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hi {receiver_name},</p>
      <p>You have been invited to join <strong>{org_name}</strong> as a <strong>{role}</strong>.</p>
      <p>{inviter_name} has sent you this invitation to collaborate on their recruitment platform.</p>
      <p style="margin: 30px 0;">
        <a href="{invitation_url}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
      </p>
      <p>This invitation link will expire in 7 days.</p>
      <p>Best regards,<br>{org_name} Team</p>
    </div>'
    WHEN 'application_received' THEN '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Dear {candidate_name},</p>
      <p>Thank you for applying for the <strong>{job_title}</strong> position at <strong>{org_name}</strong>.</p>
      <p>We have received your application and our team will review it carefully. If your qualifications match our requirements, we will contact you for the next steps.</p>
      <p>You can track your application status through our candidate portal:</p>
      <p style="margin: 30px 0;">
        <a href="{portal_url}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Application Status</a>
      </p>
      <p>Best regards,<br>{org_name} Recruitment Team</p>
    </div>'
    WHEN 'interview_scheduled' THEN '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Dear {candidate_name},</p>
      <p>We are pleased to invite you for an interview for the <strong>{job_title}</strong> position.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Date:</strong> {interview_date}</p>
        <p><strong>Time:</strong> {interview_time}</p>
        <p><strong>Type:</strong> {interview_type}</p>
        <p><strong>Location/Link:</strong> {location}</p>
        <p><strong>Interviewers:</strong> {interviewers}</p>
      </div>
      <p>Please confirm your attendance by replying to this email.</p>
      <p>Best regards,<br>{org_name} Recruitment Team</p>
    </div>'
    ELSE '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><p>Notification from {org_name}</p></div>'
  END as body_html,
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;"><p>إشعار من {org_name}</p></div>' as body_html_ar
FROM notification_events
WHERE is_system = true
ON CONFLICT (event_id) DO NOTHING;

COMMENT ON TABLE notification_events IS 'Master list of all notification event types';
COMMENT ON TABLE org_notification_settings IS 'Per-organization notification channel and audience settings';
COMMENT ON TABLE org_email_templates IS 'Customized email templates per organization';
COMMENT ON TABLE default_email_templates IS 'System-wide default email templates';
COMMENT ON TABLE notification_log IS 'Log of all sent notifications for tracking and analytics';
