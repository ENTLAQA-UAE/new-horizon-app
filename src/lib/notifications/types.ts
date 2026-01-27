// Notification System Types

export type NotificationChannel = 'mail' | 'system' | 'sms'

export type NotificationCategory = 'user' | 'recruitment' | 'interview' | 'offer' | 'job'

// Audience type: internal = org team members, candidate = external candidates
export type NotificationAudience = 'internal' | 'candidate'

export interface NotificationVariable {
  key: string
  label: string
  labelAr?: string
}

export interface NotificationEvent {
  id: string
  code: string
  name: string
  name_ar: string | null
  description: string | null
  description_ar: string | null
  category: NotificationCategory
  default_channels: NotificationChannel[]
  available_variables: NotificationVariable[]
  is_system: boolean
  audience: NotificationAudience  // 'internal' for team, 'candidate' for external
  created_at: string
}

export interface OrgNotificationSetting {
  id: string
  org_id: string
  event_id: string
  enabled: boolean
  channels: NotificationChannel[]
  audience_roles: string[]
  audience_users: string[]
  created_at: string
  updated_at: string
  // Joined fields
  event?: NotificationEvent
}

export interface OrgEmailTemplate {
  id: string
  org_id: string
  event_id: string
  subject: string
  subject_ar: string | null
  body_html: string
  body_html_ar: string | null
  body_text: string | null
  body_text_ar: string | null
  include_logo: boolean
  include_footer: boolean
  custom_variables: Record<string, string>
  created_at: string
  updated_at: string
  // Joined fields
  event?: NotificationEvent
}

export interface DefaultEmailTemplate {
  id: string
  event_id: string
  subject: string
  subject_ar: string | null
  body_html: string
  body_html_ar: string | null
  body_text: string | null
  body_text_ar: string | null
  created_at: string
  updated_at: string
}

export interface NotificationLog {
  id: string
  org_id: string | null
  event_id: string | null
  recipient_id: string | null
  recipient_email: string | null
  channel: NotificationChannel
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'opened'
  subject: string | null
  body_preview: string | null
  metadata: Record<string, any>
  error_message: string | null
  sent_at: string | null
  opened_at: string | null
  created_at: string
}

// UI Types
export interface NotificationEventWithSettings extends NotificationEvent {
  settings?: OrgNotificationSetting | null
  template?: OrgEmailTemplate | null
  defaultTemplate?: DefaultEmailTemplate | null
}

export const categoryLabels: Record<NotificationCategory, { en: string; ar: string }> = {
  user: { en: 'User Management', ar: 'إدارة المستخدمين' },
  recruitment: { en: 'Recruitment', ar: 'التوظيف' },
  interview: { en: 'Interviews', ar: 'المقابلات' },
  offer: { en: 'Offers', ar: 'العروض' },
  job: { en: 'Jobs & Requisitions', ar: 'الوظائف وطلبات التوظيف' },
}

export const channelLabels: Record<NotificationChannel, { en: string; ar: string; color: string }> = {
  mail: { en: 'Email', ar: 'البريد', color: 'bg-blue-500' },
  system: { en: 'System', ar: 'النظام', color: 'bg-purple-500' },
  sms: { en: 'SMS', ar: 'رسالة نصية', color: 'bg-green-500' },
}

export const roleLabels: Record<string, { en: string; ar: string }> = {
  super_admin: { en: 'Super Admin', ar: 'المدير العام' },
  org_admin: { en: 'Org Admin', ar: 'مدير المؤسسة' },
  hr_manager: { en: 'HR Manager', ar: 'مدير الموارد البشرية' },
  recruiter: { en: 'Recruiter', ar: 'مسؤول التوظيف' },
  hiring_manager: { en: 'Department Manager', ar: 'مدير القسم' },
  interviewer: { en: 'Interviewer', ar: 'المقابل' },
}

export const audienceLabels: Record<NotificationAudience, { en: string; ar: string; color: string; icon: string }> = {
  internal: { en: 'Internal', ar: 'داخلي', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: 'users' },
  candidate: { en: 'Candidate', ar: 'مرشح', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: 'user' },
}

// Mapping of notification event codes to their target audience
export const eventAudienceMap: Record<string, NotificationAudience> = {
  // Internal notifications (for org team members)
  user_invited: 'internal',
  user_joined: 'internal',
  role_changed: 'internal',
  new_application: 'internal',
  application_received: 'internal',
  scorecard_submitted: 'internal',
  scorecard_reminder: 'internal',
  offer_created: 'internal',
  offer_accepted: 'internal',
  offer_rejected: 'internal',
  offer_expired: 'internal',
  job_pending_approval: 'internal',
  job_approved: 'internal',
  job_published: 'internal',
  job_closed: 'internal',
  job_expiring: 'internal',
  requisition_created: 'internal',
  requisition_approved: 'internal',
  requisition_rejected: 'internal',

  // Candidate notifications (for external candidates)
  password_reset: 'candidate',
  interview_scheduled: 'candidate',
  interview_reminder: 'candidate',
  interview_cancelled: 'candidate',
  interview_rescheduled: 'candidate',
  candidate_stage_moved: 'candidate',
  candidate_disqualified: 'candidate',
  candidate_rejection: 'candidate',
  offer_sent: 'candidate',
}
