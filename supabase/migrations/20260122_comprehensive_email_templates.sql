-- Comprehensive Professional Email Templates Migration
-- Updates ALL 26 notification events with professional bilingual templates (English + Arabic RTL)
-- Created: 2026-01-22

-- First, clear existing default templates
DELETE FROM default_email_templates;

-- ============================================================================
-- PART 1: USER MANAGEMENT TEMPLATES (4 events)
-- ============================================================================

-- 1. USER INVITED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'You''ve been invited to join {{org_name}}',
  'دعوة للانضمام إلى {{org_name}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">You''re Invited!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{{receiver_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;"><strong>{{inviter_name}}</strong> has invited you to join <strong>{{org_name}}</strong> as a <strong style="color:#667eea;">{{role}}</strong>.</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 30px;">Join the team and start collaborating on our recruitment platform.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{invitation_url}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Accept Invitation</a>
    </td></tr></table>
    <p style="color:#9ca3af;font-size:13px;margin:30px 0 0;text-align:center;">This invitation expires in 7 days.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">دعوة للانضمام!</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{receiver_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">قام <strong>{{inviter_name}}</strong> بدعوتك للانضمام إلى <strong>{{org_name}}</strong> بصفة <strong style="color:#667eea;">{{role}}</strong>.</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 30px;">انضم إلى الفريق وابدأ التعاون على منصة التوظيف الخاصة بنا.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{invitation_url}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">قبول الدعوة</a>
    </td></tr></table>
    <p style="color:#9ca3af;font-size:13px;margin:30px 0 0;text-align:center;">تنتهي صلاحية هذه الدعوة خلال 7 أيام.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'user_invited';

-- 2. USER JOINED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Welcome to {{org_name}}!',
  'مرحباً بك في {{org_name}}!',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">New Team Member!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new member has joined your organization:</p>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;"><strong style="color:#166534;">Name:</strong> <span style="color:#374151;">{{user_name}}</span></p>
      <p style="margin:0 0 8px;"><strong style="color:#166534;">Email:</strong> <span style="color:#374151;">{{user_email}}</span></p>
      <p style="margin:0;"><strong style="color:#166534;">Role:</strong> <span style="color:#374151;">{{role}}</span></p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">They are now ready to start collaborating with the team.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">عضو جديد في الفريق!</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">انضم عضو جديد إلى مؤسستكم:</p>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;"><strong style="color:#166534;">الاسم:</strong> <span style="color:#374151;">{{user_name}}</span></p>
      <p style="margin:0 0 8px;"><strong style="color:#166534;">البريد الإلكتروني:</strong> <span style="color:#374151;">{{user_email}}</span></p>
      <p style="margin:0;"><strong style="color:#166534;">الدور:</strong> <span style="color:#374151;">{{role}}</span></p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0;">أصبح العضو الجديد جاهزاً للتعاون مع الفريق.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'user_joined';

-- 3. PASSWORD RESET
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Reset your password',
  'إعادة تعيين كلمة المرور',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Password Reset</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{{user_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We received a request to reset your password. Click the button below to create a new password:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{reset_url}}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Reset Password</a>
    </td></tr></table>
    <p style="color:#ef4444;font-size:14px;margin:20px 0;text-align:center;">This link expires in {{expiry_time}}.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin-top:20px;">
      <p style="color:#92400e;font-size:13px;margin:0;">If you didn''t request this password reset, please ignore this email or contact support if you have concerns.</p>
    </div>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">إعادة تعيين كلمة المرور</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{user_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{reset_url}}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">إعادة تعيين كلمة المرور</a>
    </td></tr></table>
    <p style="color:#ef4444;font-size:14px;margin:20px 0;text-align:center;">تنتهي صلاحية هذا الرابط خلال {{expiry_time}}.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin-top:20px;">
      <p style="color:#92400e;font-size:13px;margin:0;text-align:right;">إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني أو التواصل مع الدعم إذا كانت لديك مخاوف.</p>
    </div>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'password_reset';

-- 4. ROLE CHANGED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Your role has been updated at {{org_name}}',
  'تم تحديث دورك في {{org_name}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Role Updated</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{{user_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Your role has been updated by <strong>{{changed_by}}</strong>:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
      <tr>
        <td width="45%" style="background-color:#fee2e2;padding:16px;border-radius:8px;text-align:center;">
          <p style="margin:0;color:#991b1b;font-size:12px;text-transform:uppercase;">Previous Role</p>
          <p style="margin:8px 0 0;color:#dc2626;font-weight:600;font-size:16px;">{{old_role}}</p>
        </td>
        <td width="10%" style="text-align:center;color:#9ca3af;font-size:24px;">→</td>
        <td width="45%" style="background-color:#dcfce7;padding:16px;border-radius:8px;text-align:center;">
          <p style="margin:0;color:#166534;font-size:12px;text-transform:uppercase;">New Role</p>
          <p style="margin:8px 0 0;color:#16a34a;font-weight:600;font-size:16px;">{{new_role}}</p>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;text-align:center;">Your permissions have been updated accordingly.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم تحديث الدور</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{user_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم تحديث دورك بواسطة <strong>{{changed_by}}</strong>:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
      <tr>
        <td width="45%" style="background-color:#dcfce7;padding:16px;border-radius:8px;text-align:center;">
          <p style="margin:0;color:#166534;font-size:12px;">الدور الجديد</p>
          <p style="margin:8px 0 0;color:#16a34a;font-weight:600;font-size:16px;">{{new_role}}</p>
        </td>
        <td width="10%" style="text-align:center;color:#9ca3af;font-size:24px;">←</td>
        <td width="45%" style="background-color:#fee2e2;padding:16px;border-radius:8px;text-align:center;">
          <p style="margin:0;color:#991b1b;font-size:12px;">الدور السابق</p>
          <p style="margin:8px 0 0;color:#dc2626;font-weight:600;font-size:16px;">{{old_role}}</p>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0;text-align:center;">تم تحديث صلاحياتك وفقاً لذلك.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'role_changed';

-- ============================================================================
-- PART 2: RECRUITMENT TEMPLATES (5 events)
-- ============================================================================

-- 5. NEW APPLICATION (to recruiters)
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'New application received: {{candidate_name}} for {{job_title}}',
  'طلب جديد: {{candidate_name}} لوظيفة {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">New Application Received</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new candidate has applied for an open position!</p>
    <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#1e40af;">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#1e40af;">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#1e40af;">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#1e40af;">Applied:</strong></td><td style="color:#374151;">{{application_date}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Review Application</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم استلام طلب جديد</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تقدم مرشح جديد لوظيفة شاغرة!</p>
    <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#1e40af;">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#1e40af;">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#1e40af;">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#1e40af;">تاريخ التقديم:</strong></td><td style="color:#374151;text-align:left;">{{application_date}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">مراجعة الطلب</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'new_application';

-- 6. APPLICATION RECEIVED (to candidate)
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Thank you for your application - {{job_title}}',
  'شكراً على تقديمك - {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Application Received!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Thank you for applying for the <strong style="color:#059669;">{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 30px;">We have received your application and our recruitment team will review it carefully. If your qualifications match our requirements, we will contact you for the next steps.</p>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 12px;color:#166534;font-weight:600;font-size:16px;">What happens next?</p>
      <p style="margin:0;color:#6b7280;font-size:14px;">Our team will review your application within 5-7 business days. You will receive an email notification with any updates.</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{portal_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Track Your Application</a>
    </td></tr></table>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:30px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم استلام طلبك!</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">شكراً لتقدمك لوظيفة <strong style="color:#059669;">{{job_title}}</strong> في <strong>{{org_name}}</strong>.</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 30px;">لقد استلمنا طلبك وسيقوم فريق التوظيف لدينا بمراجعته بعناية. إذا تطابقت مؤهلاتك مع متطلباتنا، سنتواصل معك للخطوات التالية.</p>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 12px;color:#166534;font-weight:600;font-size:16px;">ماذا يحدث بعد ذلك؟</p>
      <p style="margin:0;color:#6b7280;font-size:14px;">سيقوم فريقنا بمراجعة طلبك خلال 5-7 أيام عمل. ستتلقى إشعاراً بالبريد الإلكتروني بأي تحديثات.</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{portal_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">تتبع طلبك</a>
    </td></tr></table>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:30px 0 0;">مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'application_received';

-- 7. CANDIDATE STAGE MOVED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Application update for {{candidate_name}}',
  'تحديث الطلب: {{candidate_name}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Pipeline Update</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A candidate has been moved to a new stage in the hiring pipeline.</p>
    <div style="background-color:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#3730a3;">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#3730a3;">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td width="45%" style="background-color:#fef3c7;padding:16px;border-radius:8px;text-align:center;">
          <p style="margin:0;color:#92400e;font-size:12px;text-transform:uppercase;">Previous Stage</p>
          <p style="margin:8px 0 0;color:#b45309;font-weight:600;font-size:16px;">{{previous_stage}}</p>
        </td>
        <td width="10%" style="text-align:center;color:#9ca3af;font-size:24px;">→</td>
        <td width="45%" style="background-color:#dbeafe;padding:16px;border-radius:8px;text-align:center;">
          <p style="margin:0;color:#1e40af;font-size:12px;text-transform:uppercase;">New Stage</p>
          <p style="margin:8px 0 0;color:#2563eb;font-weight:600;font-size:16px;">{{new_stage}}</p>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Moved by: <strong>{{moved_by}}</strong></p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Candidate</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تحديث مسار التوظيف</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم نقل مرشح إلى مرحلة جديدة في مسار التوظيف.</p>
    <div style="background-color:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#3730a3;">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#3730a3;">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td width="45%" style="background-color:#dbeafe;padding:16px;border-radius:8px;text-align:center;">
          <p style="margin:0;color:#1e40af;font-size:12px;">المرحلة الجديدة</p>
          <p style="margin:8px 0 0;color:#2563eb;font-weight:600;font-size:16px;">{{new_stage}}</p>
        </td>
        <td width="10%" style="text-align:center;color:#9ca3af;font-size:24px;">←</td>
        <td width="45%" style="background-color:#fef3c7;padding:16px;border-radius:8px;text-align:center;">
          <p style="margin:0;color:#92400e;font-size:12px;">المرحلة السابقة</p>
          <p style="margin:8px 0 0;color:#b45309;font-weight:600;font-size:16px;">{{previous_stage}}</p>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">تم النقل بواسطة: <strong>{{moved_by}}</strong></p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض المرشح</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'candidate_stage_moved';

-- 8. CANDIDATE DISQUALIFIED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Application status update for {{candidate_name}}',
  'تحديث حالة الطلب: {{candidate_name}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Candidate Disqualified</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A candidate has been disqualified from the hiring process.</p>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Reason:</strong></td><td style="color:#374151;">{{disqualification_reason}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Disqualified by:</strong></td><td style="color:#374151;">{{disqualified_by}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background:linear-gradient(135deg,#6b7280 0%,#4b5563 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Details</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم استبعاد المرشح</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم استبعاد مرشح من عملية التوظيف.</p>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">السبب:</strong></td><td style="color:#374151;text-align:left;">{{disqualification_reason}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">تم الاستبعاد بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{disqualified_by}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background:linear-gradient(135deg,#6b7280 0%,#4b5563 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض التفاصيل</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'candidate_disqualified';

-- 9. CANDIDATE REJECTION (to candidate)
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Update on your application for {{job_title}}',
  'تحديث بخصوص طلبك لوظيفة {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#6b7280 0%,#4b5563 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Application Update</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Thank you for your interest in the <strong>{{job_title}}</strong> position at <strong>{{org_name}}</strong> and for taking the time to apply.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We encourage you to apply for future positions that match your skills and experience. We wish you the best in your career journey.</p>
    <div style="background-color:#f3f4f6;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="color:#6b7280;font-size:14px;margin:0;text-align:center;">Stay connected with us for future opportunities!</p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#6b7280 0%,#4b5563 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تحديث الطلب</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">شكراً لاهتمامك بوظيفة <strong>{{job_title}}</strong> في <strong>{{org_name}}</strong> ولتخصيص وقتك للتقديم.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">بعد دراسة متأنية، قررنا المضي قدماً مع مرشحين آخرين تتطابق مؤهلاتهم بشكل أكبر مع احتياجاتنا الحالية.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">نشجعك على التقدم للوظائف المستقبلية التي تتناسب مع مهاراتك وخبراتك. نتمنى لك التوفيق في مسيرتك المهنية.</p>
    <div style="background-color:#f3f4f6;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="color:#6b7280;font-size:14px;margin:0;text-align:center;">ابق على تواصل معنا للفرص المستقبلية!</p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'candidate_rejection';

-- ============================================================================
-- PART 3: INTERVIEW TEMPLATES (6 events)
-- ============================================================================

-- 10. INTERVIEW SCHEDULED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Interview invitation - {{job_title}}',
  'دعوة لمقابلة - {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Interview Invitation</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We are pleased to invite you for an interview for the <strong style="color:#7c3aed;">{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:24px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:10px 0;width:140px;"><strong style="color:#5b21b6;">Date:</strong></td><td style="color:#374151;">{{interview_date}}</td></tr>
        <tr><td style="padding:10px 0;"><strong style="color:#5b21b6;">Time:</strong></td><td style="color:#374151;">{{interview_time}}</td></tr>
        <tr><td style="padding:10px 0;"><strong style="color:#5b21b6;">Type:</strong></td><td style="color:#374151;">{{interview_type}}</td></tr>
        <tr><td style="padding:10px 0;"><strong style="color:#5b21b6;">Location/Link:</strong></td><td style="color:#374151;">{{location}}</td></tr>
        <tr><td style="padding:10px 0;"><strong style="color:#5b21b6;">Interviewers:</strong></td><td style="color:#374151;">{{interviewers}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Please confirm your attendance by replying to this email. If you need to reschedule, let us know at least 24 hours in advance.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#92400e;font-size:14px;margin:0;"><strong>Tips for your interview:</strong> Be on time, prepare questions about the role, and have a copy of your resume ready.</p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">We look forward to meeting you!<br><br>Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">دعوة لمقابلة</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">يسعدنا دعوتك لإجراء مقابلة لوظيفة <strong style="color:#7c3aed;">{{job_title}}</strong> في <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:24px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:10px 0;text-align:right;width:120px;"><strong style="color:#5b21b6;">التاريخ:</strong></td><td style="color:#374151;text-align:left;">{{interview_date}}</td></tr>
        <tr><td style="padding:10px 0;text-align:right;"><strong style="color:#5b21b6;">الوقت:</strong></td><td style="color:#374151;text-align:left;">{{interview_time}}</td></tr>
        <tr><td style="padding:10px 0;text-align:right;"><strong style="color:#5b21b6;">النوع:</strong></td><td style="color:#374151;text-align:left;">{{interview_type}}</td></tr>
        <tr><td style="padding:10px 0;text-align:right;"><strong style="color:#5b21b6;">المكان/الرابط:</strong></td><td style="color:#374151;text-align:left;">{{location}}</td></tr>
        <tr><td style="padding:10px 0;text-align:right;"><strong style="color:#5b21b6;">المقابلون:</strong></td><td style="color:#374151;text-align:left;">{{interviewers}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">يرجى تأكيد حضورك بالرد على هذا البريد الإلكتروني. إذا كنت بحاجة لإعادة جدولة الموعد، يرجى إعلامنا قبل 24 ساعة على الأقل.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#92400e;font-size:14px;margin:0;text-align:right;"><strong>نصائح للمقابلة:</strong> كن في الموعد، حضّر أسئلة عن الدور، واحتفظ بنسخة من سيرتك الذاتية.</p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">نتطلع للقائك!<br><br>مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'interview_scheduled';

-- 11. INTERVIEW REMINDER
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Interview reminder - Tomorrow at {{interview_time}}',
  'تذكير بالمقابلة - غداً الساعة {{interview_time}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Interview Reminder</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">This is a friendly reminder about your upcoming interview for the <strong style="color:#d97706;">{{job_title}}</strong> position.</p>
    <div style="background-color:#fef3c7;border:2px solid #fcd34d;border-radius:12px;padding:30px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;color:#92400e;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Your Interview</p>
      <p style="margin:0 0 4px;color:#78350f;font-size:28px;font-weight:700;">{{interview_date}}</p>
      <p style="margin:0;color:#b45309;font-size:20px;font-weight:600;">at {{interview_time}}</p>
      <hr style="border:none;border-top:1px solid #fcd34d;margin:20px 0;">
      <p style="margin:0;color:#92400e;font-size:14px;">{{interview_type}} • {{location}}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Please ensure you are ready a few minutes before the scheduled time. Good luck!</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">We look forward to speaking with you!<br><br>Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تذكير بالمقابلة</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">هذا تذكير ودي بموعد مقابلتك القادمة لوظيفة <strong style="color:#d97706;">{{job_title}}</strong>.</p>
    <div style="background-color:#fef3c7;border:2px solid #fcd34d;border-radius:12px;padding:30px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;color:#92400e;font-size:14px;letter-spacing:1px;">موعد المقابلة</p>
      <p style="margin:0 0 4px;color:#78350f;font-size:28px;font-weight:700;">{{interview_date}}</p>
      <p style="margin:0;color:#b45309;font-size:20px;font-weight:600;">الساعة {{interview_time}}</p>
      <hr style="border:none;border-top:1px solid #fcd34d;margin:20px 0;">
      <p style="margin:0;color:#92400e;font-size:14px;">{{interview_type}} • {{location}}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">يرجى التأكد من جاهزيتك قبل الموعد المحدد بدقائق قليلة. حظاً موفقاً!</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">نتطلع للتحدث معك!<br><br>مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'interview_reminder';

-- 12. INTERVIEW CANCELLED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Interview cancelled - {{job_title}}',
  'إلغاء المقابلة - {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Interview Cancelled</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We regret to inform you that your interview for the <strong>{{job_title}}</strong> position has been cancelled.</p>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:24px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Original Date:</strong></td><td style="color:#374151;">{{interview_date}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Original Time:</strong></td><td style="color:#374151;">{{interview_time}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Reason:</strong></td><td style="color:#374151;">{{cancellation_reason}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">We apologize for any inconvenience this may cause. Our recruitment team will be in touch shortly to discuss next steps or reschedule if applicable.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">Thank you for your understanding.<br><br>Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم إلغاء المقابلة</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">نأسف لإبلاغك بأنه تم إلغاء مقابلتك لوظيفة <strong>{{job_title}}</strong>.</p>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:24px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">التاريخ الأصلي:</strong></td><td style="color:#374151;text-align:left;">{{interview_date}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">الوقت الأصلي:</strong></td><td style="color:#374151;text-align:left;">{{interview_time}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">السبب:</strong></td><td style="color:#374151;text-align:left;">{{cancellation_reason}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">نعتذر عن أي إزعاج قد يسببه ذلك. سيتواصل معك فريق التوظيف قريباً لمناقشة الخطوات التالية أو إعادة الجدولة إن أمكن.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">شكراً لتفهمك.<br><br>مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'interview_cancelled';

-- 13. INTERVIEW RESCHEDULED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Interview rescheduled - {{job_title}}',
  'تغيير موعد المقابلة - {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Interview Rescheduled</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Your interview for the <strong style="color:#d97706;">{{job_title}}</strong> position has been rescheduled. Please note the new details below:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td width="48%" style="background-color:#fef2f2;padding:20px;border-radius:8px;vertical-align:top;">
          <p style="margin:0 0 12px;color:#991b1b;font-size:12px;text-transform:uppercase;font-weight:600;">Previous Schedule</p>
          <p style="margin:0 0 4px;color:#7f1d1d;font-size:14px;"><s>{{old_interview_date}}</s></p>
          <p style="margin:0;color:#7f1d1d;font-size:14px;"><s>{{old_interview_time}}</s></p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background-color:#dcfce7;padding:20px;border-radius:8px;vertical-align:top;">
          <p style="margin:0 0 12px;color:#166534;font-size:12px;text-transform:uppercase;font-weight:600;">New Schedule</p>
          <p style="margin:0 0 4px;color:#14532d;font-size:14px;font-weight:600;">{{interview_date}}</p>
          <p style="margin:0;color:#14532d;font-size:14px;font-weight:600;">{{interview_time}}</p>
        </td>
      </tr>
    </table>
    <div style="background-color:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;"><strong style="color:#5b21b6;">Type:</strong> <span style="color:#374151;">{{interview_type}}</span></p>
      <p style="margin:0;"><strong style="color:#5b21b6;">Location/Link:</strong> <span style="color:#374151;">{{location}}</span></p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Please confirm your availability for the new time by replying to this email.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">We apologize for any inconvenience and look forward to speaking with you!<br><br>Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم تغيير موعد المقابلة</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم تغيير موعد مقابلتك لوظيفة <strong style="color:#d97706;">{{job_title}}</strong>. يرجى ملاحظة التفاصيل الجديدة أدناه:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td width="48%" style="background-color:#dcfce7;padding:20px;border-radius:8px;vertical-align:top;">
          <p style="margin:0 0 12px;color:#166534;font-size:12px;font-weight:600;">الموعد الجديد</p>
          <p style="margin:0 0 4px;color:#14532d;font-size:14px;font-weight:600;">{{interview_date}}</p>
          <p style="margin:0;color:#14532d;font-size:14px;font-weight:600;">{{interview_time}}</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background-color:#fef2f2;padding:20px;border-radius:8px;vertical-align:top;">
          <p style="margin:0 0 12px;color:#991b1b;font-size:12px;font-weight:600;">الموعد السابق</p>
          <p style="margin:0 0 4px;color:#7f1d1d;font-size:14px;"><s>{{old_interview_date}}</s></p>
          <p style="margin:0;color:#7f1d1d;font-size:14px;"><s>{{old_interview_time}}</s></p>
        </td>
      </tr>
    </table>
    <div style="background-color:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;text-align:right;"><strong style="color:#5b21b6;">النوع:</strong> <span style="color:#374151;">{{interview_type}}</span></p>
      <p style="margin:0;text-align:right;"><strong style="color:#5b21b6;">المكان/الرابط:</strong> <span style="color:#374151;">{{location}}</span></p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">يرجى تأكيد توفرك للموعد الجديد بالرد على هذا البريد الإلكتروني.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">نعتذر عن أي إزعاج ونتطلع للتحدث معك!<br><br>مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'interview_rescheduled';

-- 14. SCORECARD SUBMITTED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'New scorecard submitted for {{candidate_name}}',
  'تقييم جديد لـ {{candidate_name}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Scorecard Submitted</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new interview scorecard has been submitted.</p>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Interviewer:</strong></td><td style="color:#374151;">{{interviewer_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Overall Rating:</strong></td><td style="color:#374151;">{{overall_rating}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Recommendation:</strong></td><td style="color:#374151;">{{recommendation}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{scorecard_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Full Scorecard</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم تقديم التقييم</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم تقديم تقييم مقابلة جديد.</p>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">المقابِل:</strong></td><td style="color:#374151;text-align:left;">{{interviewer_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">التقييم العام:</strong></td><td style="color:#374151;text-align:left;">{{overall_rating}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">التوصية:</strong></td><td style="color:#374151;text-align:left;">{{recommendation}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{scorecard_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض التقييم الكامل</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'scorecard_submitted';

-- 15. SCORECARD REMINDER
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Please submit your interview feedback',
  'يرجى تقديم تقييم المقابلة',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Scorecard Reminder</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{{interviewer_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">This is a reminder to submit your interview feedback for the following candidate:</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#92400e;">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#92400e;">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#92400e;">Interview Date:</strong></td><td style="color:#374151;">{{interview_date}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">Your timely feedback helps us make better hiring decisions and keeps the recruitment process moving smoothly.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{scorecard_url}}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Submit Scorecard</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تذكير بتقديم التقييم</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{interviewer_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">هذا تذكير بتقديم تقييمك للمقابلة مع المرشح التالي:</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#92400e;">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#92400e;">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#92400e;">تاريخ المقابلة:</strong></td><td style="color:#374151;text-align:left;">{{interview_date}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 24px;">تقييمك في الوقت المناسب يساعدنا على اتخاذ قرارات توظيف أفضل ويحافظ على سلاسة عملية التوظيف.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{scorecard_url}}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">تقديم التقييم</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'scorecard_reminder';

-- ============================================================================
-- PART 4: OFFER TEMPLATES (5 events)
-- ============================================================================

-- 16. OFFER CREATED (internal notification)
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'New offer created for {{candidate_name}}',
  'عرض جديد لـ {{candidate_name}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">New Offer Created</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new job offer has been created and is pending approval.</p>
    <div style="background-color:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#5b21b6;">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#5b21b6;">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#5b21b6;">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#5b21b6;">Salary:</strong></td><td style="color:#374151;">{{salary}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#5b21b6;">Start Date:</strong></td><td style="color:#374151;">{{start_date}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#5b21b6;">Created By:</strong></td><td style="color:#374151;">{{created_by}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{offer_url}}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Review Offer</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم إنشاء عرض جديد</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم إنشاء عرض وظيفي جديد وينتظر الموافقة.</p>
    <div style="background-color:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#5b21b6;">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#5b21b6;">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#5b21b6;">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#5b21b6;">الراتب:</strong></td><td style="color:#374151;text-align:left;">{{salary}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#5b21b6;">تاريخ البدء:</strong></td><td style="color:#374151;text-align:left;">{{start_date}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#5b21b6;">أنشئ بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{created_by}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{offer_url}}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">مراجعة العرض</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'offer_created';

-- 17. OFFER SENT (to candidate)
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Job offer from {{org_name}} - {{job_title}}',
  'عرض وظيفي من {{org_name}} - {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Congratulations!</h1>
    <p style="color:#d1fae5;margin:10px 0 0;font-size:16px;">Job Offer</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We are thrilled to extend an offer of employment for the position of <strong style="color:#059669;">{{job_title}}</strong> at <strong>{{org_name}}</strong>.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">After careful consideration, we believe your skills, experience, and passion make you an excellent fit for our team. We were impressed by your qualifications and are excited about the contributions you can make.</p>
    <div style="background-color:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:24px;margin:24px 0;">
      <p style="margin:0 0 16px;color:#166534;font-weight:600;font-size:18px;text-align:center;">Your Offer Details</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:10px 0;border-bottom:1px solid #bbf7d0;"><strong style="color:#166534;">Position:</strong></td><td style="color:#374151;border-bottom:1px solid #bbf7d0;">{{job_title}}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #bbf7d0;"><strong style="color:#166534;">Department:</strong></td><td style="color:#374151;border-bottom:1px solid #bbf7d0;">{{department}}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #bbf7d0;"><strong style="color:#166534;">Start Date:</strong></td><td style="color:#374151;border-bottom:1px solid #bbf7d0;">{{start_date}}</td></tr>
        <tr><td style="padding:10px 0;"><strong style="color:#166534;">Reports To:</strong></td><td style="color:#374151;">{{manager_name}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:10px 0;">
      <a href="{{offer_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:18px 50px;text-decoration:none;border-radius:8px;font-weight:600;font-size:18px;">View Full Offer</a>
    </td></tr></table>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:24px 0;text-align:center;">
      <p style="margin:0;color:#92400e;font-size:14px;">This offer expires on <strong>{{expiry_date}}</strong>. Please respond before the deadline.</p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">We hope you will accept this offer and join our team. If you have any questions, please don''t hesitate to reach out.<br><br>Welcome aboard!<br><strong>{{org_name}} Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تهانينا!</h1>
    <p style="color:#d1fae5;margin:10px 0 0;font-size:16px;">عرض وظيفي</p>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">يسعدنا أن نقدم لك عرض عمل لوظيفة <strong style="color:#059669;">{{job_title}}</strong> في <strong>{{org_name}}</strong>.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">بعد دراسة متأنية، نؤمن بأن مهاراتك وخبراتك وشغفك تجعلك مناسباً تماماً لفريقنا. لقد أعجبنا بمؤهلاتك ونتطلع للمساهمات التي يمكنك تقديمها.</p>
    <div style="background-color:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:24px;margin:24px 0;">
      <p style="margin:0 0 16px;color:#166534;font-weight:600;font-size:18px;text-align:center;">تفاصيل العرض</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:10px 0;border-bottom:1px solid #bbf7d0;text-align:right;"><strong style="color:#166534;">الوظيفة:</strong></td><td style="color:#374151;border-bottom:1px solid #bbf7d0;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #bbf7d0;text-align:right;"><strong style="color:#166534;">القسم:</strong></td><td style="color:#374151;border-bottom:1px solid #bbf7d0;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #bbf7d0;text-align:right;"><strong style="color:#166534;">تاريخ البدء:</strong></td><td style="color:#374151;border-bottom:1px solid #bbf7d0;text-align:left;">{{start_date}}</td></tr>
        <tr><td style="padding:10px 0;text-align:right;"><strong style="color:#166534;">المدير المباشر:</strong></td><td style="color:#374151;text-align:left;">{{manager_name}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:10px 0;">
      <a href="{{offer_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:18px 50px;text-decoration:none;border-radius:8px;font-weight:600;font-size:18px;">عرض تفاصيل العرض</a>
    </td></tr></table>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:24px 0;text-align:center;">
      <p style="margin:0;color:#92400e;font-size:14px;">تنتهي صلاحية هذا العرض في <strong>{{expiry_date}}</strong>. يرجى الرد قبل الموعد النهائي.</p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">نأمل أن تقبل هذا العرض وتنضم إلى فريقنا. إذا كانت لديك أي أسئلة، لا تتردد في التواصل معنا.<br><br>أهلاً بك معنا!<br><strong>فريق {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'offer_sent';

-- 18. OFFER ACCEPTED (internal notification)
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Great news! {{candidate_name}} accepted the offer',
  'أخبار رائعة! قبل {{candidate_name}} العرض',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Offer Accepted!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Great news! A candidate has accepted our job offer.</p>
    <div style="background-color:#dcfce7;border:2px solid #86efac;border-radius:12px;padding:30px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;color:#166534;font-size:14px;">New Team Member</p>
      <p style="margin:0 0 4px;color:#14532d;font-size:24px;font-weight:700;">{{candidate_name}}</p>
      <p style="margin:0;color:#166534;font-size:16px;">{{job_title}}</p>
    </div>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Start Date:</strong></td><td style="color:#374151;font-weight:600;">{{start_date}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Accepted On:</strong></td><td style="color:#374151;">{{accepted_date}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">Please begin the onboarding process to ensure everything is ready for their first day.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{candidate_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Start Onboarding</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم قبول العرض!</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">أخبار رائعة! قبل مرشح عرض العمل المقدم.</p>
    <div style="background-color:#dcfce7;border:2px solid #86efac;border-radius:12px;padding:30px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;color:#166534;font-size:14px;">عضو جديد في الفريق</p>
      <p style="margin:0 0 4px;color:#14532d;font-size:24px;font-weight:700;">{{candidate_name}}</p>
      <p style="margin:0;color:#166534;font-size:16px;">{{job_title}}</p>
    </div>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">تاريخ البدء:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{start_date}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">تاريخ القبول:</strong></td><td style="color:#374151;text-align:left;">{{accepted_date}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 24px;">يرجى البدء في عملية التهيئة لضمان جاهزية كل شيء ليومه الأول.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{candidate_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">بدء التهيئة</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'offer_accepted';

-- 19. OFFER REJECTED (internal notification)
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  '{{candidate_name}} has declined the offer',
  'رفض {{candidate_name}} العرض',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Offer Declined</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Unfortunately, a candidate has declined our job offer.</p>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Reason:</strong></td><td style="color:#374151;">{{rejection_reason}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Declined On:</strong></td><td style="color:#374151;">{{declined_date}}</td></tr>
      </table>
    </div>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#92400e;font-size:14px;margin:0;"><strong>Next Steps:</strong> Consider reaching out to other qualified candidates in the pipeline for this position.</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Other Candidates</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم رفض العرض</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">للأسف، رفض مرشح عرض العمل المقدم.</p>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">السبب:</strong></td><td style="color:#374151;text-align:left;">{{rejection_reason}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">تاريخ الرفض:</strong></td><td style="color:#374151;text-align:left;">{{declined_date}}</td></tr>
      </table>
    </div>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#92400e;font-size:14px;margin:0;text-align:right;"><strong>الخطوات التالية:</strong> فكر في التواصل مع مرشحين مؤهلين آخرين في قائمة المتقدمين لهذه الوظيفة.</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض المرشحين الآخرين</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'offer_rejected';

-- 20. OFFER EXPIRED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Offer expired for {{candidate_name}}',
  'انتهت صلاحية العرض: {{candidate_name}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Offer Expired</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A job offer has expired without a response from the candidate.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#92400e;">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#92400e;">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#92400e;">Expiry Date:</strong></td><td style="color:#374151;">{{expiry_date}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#92400e;">Days Since Sent:</strong></td><td style="color:#374151;">{{days_since_sent}} days</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">You may want to follow up with the candidate to determine if they are still interested, or consider extending a new offer with updated terms.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:0 8px;">
          <a href="{{candidate_url}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Candidate</a>
        </td>
        <td align="center" style="padding:0 8px;">
          <a href="{{job_url}}" style="display:inline-block;background:linear-gradient(135deg,#6b7280 0%,#4b5563 100%);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Job Pipeline</a>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">انتهت صلاحية العرض</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">انتهت صلاحية عرض العمل دون استجابة من المرشح.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#92400e;">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#92400e;">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#92400e;">تاريخ الانتهاء:</strong></td><td style="color:#374151;text-align:left;">{{expiry_date}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#92400e;">أيام منذ الإرسال:</strong></td><td style="color:#374151;text-align:left;">{{days_since_sent}} يوم</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 24px;">قد ترغب في المتابعة مع المرشح لمعرفة ما إذا كان لا يزال مهتماً، أو التفكير في تقديم عرض جديد بشروط محدثة.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:0 8px;">
          <a href="{{candidate_url}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">عرض المرشح</a>
        </td>
        <td align="center" style="padding:0 8px;">
          <a href="{{job_url}}" style="display:inline-block;background:linear-gradient(135deg,#6b7280 0%,#4b5563 100%);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">عرض مسار الوظيفة</a>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'offer_expired';

-- ============================================================================
-- PART 5: JOB & REQUISITION TEMPLATES (6 events)
-- ============================================================================

-- 21. JOB PUBLISHED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Job published: {{job_title}}',
  'تم نشر الوظيفة: {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Job Published!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new job posting is now live on your career page!</p>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Position:</strong></td><td style="color:#374151;font-weight:600;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Location:</strong></td><td style="color:#374151;">{{location}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Employment Type:</strong></td><td style="color:#374151;">{{employment_type}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Published By:</strong></td><td style="color:#374151;">{{published_by}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">Candidates can now view and apply for this position. Share the job posting to attract qualified candidates.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:0 8px;">
          <a href="{{job_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Job Posting</a>
        </td>
        <td align="center" style="padding:0 8px;">
          <a href="{{careers_url}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Career Page</a>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم نشر الوظيفة!</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">إعلان وظيفة جديد متاح الآن على صفحة التوظيف!</p>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">الوظيفة:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">الموقع:</strong></td><td style="color:#374151;text-align:left;">{{location}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">نوع التوظيف:</strong></td><td style="color:#374151;text-align:left;">{{employment_type}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">تم النشر بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{published_by}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 24px;">يمكن للمرشحين الآن عرض هذه الوظيفة والتقديم عليها. شارك الإعلان لجذب المرشحين المؤهلين.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:0 8px;">
          <a href="{{job_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">عرض الوظيفة</a>
        </td>
        <td align="center" style="padding:0 8px;">
          <a href="{{careers_url}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">صفحة التوظيف</a>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'job_published';

-- 22. JOB CLOSED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Job closed: {{job_title}}',
  'تم إغلاق الوظيفة: {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#6b7280 0%,#4b5563 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Job Closed</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A job posting has been closed and is no longer accepting applications.</p>
    <div style="background-color:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#4b5563;">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#4b5563;">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#4b5563;">Closed By:</strong></td><td style="color:#374151;">{{closed_by}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#4b5563;">Reason:</strong></td><td style="color:#374151;">{{close_reason}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#4b5563;">Total Applications:</strong></td><td style="color:#374151;">{{total_applications}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">The job posting has been removed from your career page. Any pending applications will remain in the system for review.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Job Details</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#6b7280 0%,#4b5563 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم إغلاق الوظيفة</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم إغلاق إعلان الوظيفة ولم يعد يقبل طلبات جديدة.</p>
    <div style="background-color:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#4b5563;">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#4b5563;">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#4b5563;">تم الإغلاق بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{closed_by}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#4b5563;">السبب:</strong></td><td style="color:#374151;text-align:left;">{{close_reason}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#4b5563;">إجمالي الطلبات:</strong></td><td style="color:#374151;text-align:left;">{{total_applications}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 24px;">تم إزالة إعلان الوظيفة من صفحة التوظيف. ستبقى الطلبات المعلقة في النظام للمراجعة.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض تفاصيل الوظيفة</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'job_closed';

-- 23. JOB EXPIRING
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Job posting expiring soon: {{job_title}}',
  'الوظيفة ستنتهي قريباً: {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Job Expiring Soon</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A job posting is about to expire and will be automatically closed.</p>
    <div style="background-color:#fef3c7;border:2px solid #fcd34d;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;color:#92400e;font-size:14px;">Expires In</p>
      <p style="margin:0;color:#78350f;font-size:36px;font-weight:700;">{{days_remaining}} Days</p>
    </div>
    <div style="background-color:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;"><strong style="color:#4b5563;">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:6px 0;"><strong style="color:#4b5563;">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:6px 0;"><strong style="color:#4b5563;">Expiry Date:</strong></td><td style="color:#374151;">{{expiry_date}}</td></tr>
        <tr><td style="padding:6px 0;"><strong style="color:#4b5563;">Applications:</strong></td><td style="color:#374151;">{{total_applications}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">If you need to keep this job posting active, please extend the expiry date or republish the job.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Manage Job Posting</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">الوظيفة ستنتهي قريباً</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">إعلان الوظيفة على وشك الانتهاء وسيتم إغلاقه تلقائياً.</p>
    <div style="background-color:#fef3c7;border:2px solid #fcd34d;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;color:#92400e;font-size:14px;">تنتهي خلال</p>
      <p style="margin:0;color:#78350f;font-size:36px;font-weight:700;">{{days_remaining}} يوم</p>
    </div>
    <div style="background-color:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;text-align:right;"><strong style="color:#4b5563;">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:6px 0;text-align:right;"><strong style="color:#4b5563;">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:6px 0;text-align:right;"><strong style="color:#4b5563;">تاريخ الانتهاء:</strong></td><td style="color:#374151;text-align:left;">{{expiry_date}}</td></tr>
        <tr><td style="padding:6px 0;text-align:right;"><strong style="color:#4b5563;">الطلبات:</strong></td><td style="color:#374151;text-align:left;">{{total_applications}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 24px;">إذا كنت بحاجة لإبقاء إعلان الوظيفة نشطاً، يرجى تمديد تاريخ الانتهاء أو إعادة نشر الوظيفة.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">إدارة الوظيفة</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'job_expiring';

-- 24. REQUISITION CREATED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'New requisition submitted: {{job_title}}',
  'طلب توظيف جديد: {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">New Requisition</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new job requisition has been submitted and requires your approval.</p>
    <div style="background-color:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:#3730a3;">Position:</strong></td><td style="color:#374151;font-weight:600;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#3730a3;">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#3730a3;">Requested By:</strong></td><td style="color:#374151;">{{requested_by}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#3730a3;">Headcount:</strong></td><td style="color:#374151;">{{headcount}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#3730a3;">Priority:</strong></td><td style="color:#374151;">{{priority}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#3730a3;">Submitted:</strong></td><td style="color:#374151;">{{submitted_date}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">Please review the requisition details and approve or reject the request.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{requisition_url}}" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Review Requisition</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">طلب توظيف جديد</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم تقديم طلب توظيف جديد ويتطلب موافقتك.</p>
    <div style="background-color:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#3730a3;">الوظيفة:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#3730a3;">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#3730a3;">مقدم الطلب:</strong></td><td style="color:#374151;text-align:left;">{{requested_by}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#3730a3;">عدد الموظفين:</strong></td><td style="color:#374151;text-align:left;">{{headcount}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#3730a3;">الأولوية:</strong></td><td style="color:#374151;text-align:left;">{{priority}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#3730a3;">تاريخ التقديم:</strong></td><td style="color:#374151;text-align:left;">{{submitted_date}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 24px;">يرجى مراجعة تفاصيل الطلب والموافقة عليه أو رفضه.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{requisition_url}}" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">مراجعة الطلب</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'requisition_created';

-- 25. REQUISITION APPROVED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Requisition approved: {{job_title}}',
  'تمت الموافقة على طلب التوظيف: {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Requisition Approved!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Great news! Your job requisition has been approved.</p>
    <div style="background-color:#dcfce7;border:2px solid #86efac;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 4px;color:#166534;font-size:14px;">APPROVED</p>
      <p style="margin:0;color:#14532d;font-size:20px;font-weight:700;">{{job_title}}</p>
    </div>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;"><strong style="color:#166534;">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:6px 0;"><strong style="color:#166534;">Approved By:</strong></td><td style="color:#374151;">{{approved_by}}</td></tr>
        <tr><td style="padding:6px 0;"><strong style="color:#166534;">Approved On:</strong></td><td style="color:#374151;">{{approved_date}}</td></tr>
        <tr><td style="padding:6px 0;"><strong style="color:#166534;">Headcount:</strong></td><td style="color:#374151;">{{headcount}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">You can now proceed to create and publish the job posting to start receiving applications.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{create_job_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Create Job Posting</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تمت الموافقة على الطلب!</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">أخبار رائعة! تمت الموافقة على طلب التوظيف الخاص بك.</p>
    <div style="background-color:#dcfce7;border:2px solid #86efac;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 4px;color:#166534;font-size:14px;">تمت الموافقة</p>
      <p style="margin:0;color:#14532d;font-size:20px;font-weight:700;">{{job_title}}</p>
    </div>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;text-align:right;"><strong style="color:#166534;">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:6px 0;text-align:right;"><strong style="color:#166534;">تمت الموافقة بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{approved_by}}</td></tr>
        <tr><td style="padding:6px 0;text-align:right;"><strong style="color:#166534;">تاريخ الموافقة:</strong></td><td style="color:#374151;text-align:left;">{{approved_date}}</td></tr>
        <tr><td style="padding:6px 0;text-align:right;"><strong style="color:#166534;">عدد الموظفين:</strong></td><td style="color:#374151;text-align:left;">{{headcount}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 24px;">يمكنك الآن المتابعة لإنشاء ونشر إعلان الوظيفة لبدء استقبال الطلبات.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{create_job_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">إنشاء إعلان الوظيفة</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'requisition_approved';

-- 26. REQUISITION REJECTED
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT id,
  'Requisition rejected: {{job_title}}',
  'تم رفض طلب التوظيف: {{job_title}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Requisition Rejected</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Unfortunately, your job requisition has been rejected.</p>
    <div style="background-color:#fef2f2;border:2px solid #fecaca;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 4px;color:#991b1b;font-size:14px;">REJECTED</p>
      <p style="margin:0;color:#7f1d1d;font-size:20px;font-weight:700;">{{job_title}}</p>
    </div>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;"><strong style="color:#991b1b;">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:6px 0;"><strong style="color:#991b1b;">Rejected By:</strong></td><td style="color:#374151;">{{rejected_by}}</td></tr>
        <tr><td style="padding:6px 0;"><strong style="color:#991b1b;">Rejected On:</strong></td><td style="color:#374151;">{{rejected_date}}</td></tr>
        <tr><td style="padding:6px 0;"><strong style="color:#991b1b;">Reason:</strong></td><td style="color:#374151;">{{rejection_reason}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">If you believe this decision should be reconsidered, please contact the approver directly to discuss your requirements.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{requisition_url}}" style="display:inline-block;background:linear-gradient(135deg,#6b7280 0%,#4b5563 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Requisition</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم رفض الطلب</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">للأسف، تم رفض طلب التوظيف الخاص بك.</p>
    <div style="background-color:#fef2f2;border:2px solid #fecaca;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 4px;color:#991b1b;font-size:14px;">مرفوض</p>
      <p style="margin:0;color:#7f1d1d;font-size:20px;font-weight:700;">{{job_title}}</p>
    </div>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;text-align:right;"><strong style="color:#991b1b;">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:6px 0;text-align:right;"><strong style="color:#991b1b;">تم الرفض بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{rejected_by}}</td></tr>
        <tr><td style="padding:6px 0;text-align:right;"><strong style="color:#991b1b;">تاريخ الرفض:</strong></td><td style="color:#374151;text-align:left;">{{rejected_date}}</td></tr>
        <tr><td style="padding:6px 0;text-align:right;"><strong style="color:#991b1b;">السبب:</strong></td><td style="color:#374151;text-align:left;">{{rejection_reason}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 24px;">إذا كنت تعتقد أن هذا القرار يجب إعادة النظر فيه، يرجى التواصل مع المعتمد مباشرة لمناقشة متطلباتك.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{requisition_url}}" style="display:inline-block;background:linear-gradient(135deg,#6b7280 0%,#4b5563 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض الطلب</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
FROM notification_events WHERE code = 'requisition_rejected';

-- ============================================================================
-- Migration complete - All 26 email templates have been updated
-- ============================================================================
