-- =====================================================
-- FIX: Notification & Email Schema Alignment
-- =====================================================
-- 1. Add missing 'audience' column to notification_events
-- 2. Seed missing notification events (job_pending_approval, job_approved)
-- 3. Ensure all notification tables exist (idempotent)

-- =====================================================
-- 1. ADD AUDIENCE COLUMN TO NOTIFICATION_EVENTS
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_events' AND column_name = 'audience'
  ) THEN
    ALTER TABLE notification_events ADD COLUMN audience VARCHAR(20) DEFAULT 'internal';
  END IF;
END $$;

-- Set audience values for existing events
UPDATE notification_events SET audience = 'candidate' WHERE code IN (
  'password_reset',
  'application_received',
  'interview_scheduled',
  'interview_reminder',
  'interview_cancelled',
  'interview_rescheduled',
  'candidate_stage_moved',
  'candidate_disqualified',
  'candidate_rejection',
  'offer_sent'
);

UPDATE notification_events SET audience = 'internal' WHERE audience IS NULL OR audience = 'internal';

-- =====================================================
-- 2. SEED MISSING NOTIFICATION EVENTS
-- =====================================================
INSERT INTO notification_events (code, name, name_ar, description, category, default_channels, available_variables, is_system, audience) VALUES
('job_pending_approval', 'Job Pending Approval', 'وظيفة بانتظار الموافقة',
 'Sent when a job is submitted for approval', 'job', ARRAY['mail', 'system'],
 '[{"key": "job_title", "label": "Job Title"}, {"key": "department", "label": "Department"}, {"key": "submitted_by", "label": "Submitted By"}]',
 true, 'internal'),

('job_approved', 'Job Approved', 'تمت الموافقة على الوظيفة',
 'Sent when a job is approved', 'job', ARRAY['mail', 'system'],
 '[{"key": "job_title", "label": "Job Title"}, {"key": "approved_by", "label": "Approved By"}]',
 true, 'internal')

ON CONFLICT (code) DO UPDATE SET audience = EXCLUDED.audience;
