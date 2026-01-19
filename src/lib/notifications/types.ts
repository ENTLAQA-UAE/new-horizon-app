// Notification System Types

export type NotificationChannel = 'mail' | 'system' | 'sms'

export type NotificationCategory = 'user' | 'recruitment' | 'interview' | 'offer' | 'job'

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
  hiring_manager: { en: 'Hiring Manager', ar: 'مدير التوظيف' },
  interviewer: { en: 'Interviewer', ar: 'المقابل' },
}
