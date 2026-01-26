-- ============================================================================
-- EMAIL TEMPLATES WITH FIXED COLORS (NOT ORG BRANDING)
-- ============================================================================
-- This migration updates ALL email templates to use fixed colors:
-- - Header: White background with org logo
-- - Primary text color: #1e40af (blue-800)
-- - Button color: #6b7280 (gray-500)
-- - Consistent design across all organizations
-- ============================================================================

-- ============================================================================
-- 1. PASSWORD RESET
-- ============================================================================
UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{user_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Your role at <strong>{{org_name}}</strong> has been updated.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">We received a request to reset your password. Click the button below to create a new password:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{reset_url}}" style="display:inline-block;background-color:#6b7280;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Reset Password</a>
    </td></tr></table>
    <p style="color:#6b7280;font-size:14px;margin:24px 0 0;text-align:center;">This link expires in {{expiry_time}}.</p>
    <div style="background-color:#fef3c7;border-radius:8px;padding:16px;margin-top:24px;">
      <p style="color:#92400e;font-size:13px;margin:0;">If you didn''t request this password reset, please ignore this email or contact support if you have concerns.</p>
    </div>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
body_html_ar = '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{user_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{reset_url}}" style="display:inline-block;background-color:#6b7280;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">إعادة تعيين كلمة المرور</a>
    </td></tr></table>
    <p style="color:#6b7280;font-size:14px;margin:24px 0 0;text-align:center;">تنتهي صلاحية هذا الرابط خلال {{expiry_time}}.</p>
    <div style="background-color:#fef3c7;border-radius:8px;padding:16px;margin-top:24px;">
      <p style="color:#92400e;font-size:13px;margin:0;text-align:right;">إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني أو التواصل مع الدعم.</p>
    </div>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'password_reset');

-- ============================================================================
-- 2. ROLE CHANGED
-- ============================================================================
UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{user_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Your role at <strong>{{org_name}}</strong> has been updated.</p>
    <div style="background-color:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Previous Role:</span></td><td style="color:#374151;padding:8px 0;">{{previous_role}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#111827;">New Role:</strong></td><td style="color:#374151;padding:8px 0;font-weight:600;">{{role}}</td></tr>
        <tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Changed by:</span></td><td style="color:#374151;padding:8px 0;">{{changed_by}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Your access permissions have been updated accordingly. If you have any questions about your new role, please contact your administrator.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:24px 0 0;">Best regards,<br><strong>{{org_name}} Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
body_html_ar = '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{user_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">تم تحديث دورك في <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><span style="color:#1e40af;font-weight:600;">الدور السابق:</span></td><td style="color:#374151;padding:8px 0;text-align:left;">{{previous_role}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#111827;">الدور الجديد:</strong></td><td style="color:#374151;padding:8px 0;font-weight:600;text-align:left;">{{role}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><span style="color:#1e40af;font-weight:600;">تم التغيير بواسطة:</span></td><td style="color:#374151;padding:8px 0;text-align:left;">{{changed_by}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0;">تم تحديث صلاحيات الوصول الخاصة بك وفقاً لذلك. إذا كانت لديك أي أسئلة حول دورك الجديد، يرجى التواصل مع المسؤول.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:24px 0 0;">مع أطيب التحيات،<br><strong>فريق {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'role_changed');

-- ============================================================================
-- 3. USER INVITED
-- ============================================================================
UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{user_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;"><strong>{{inviter_name}}</strong> has invited you to join <strong>{{org_name}}</strong> as a <strong>{{role}}</strong>.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Click the button below to accept this invitation and set up your account.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{invitation_url}}" style="display:inline-block;background-color:#6b7280;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Accept Invitation</a>
    </td></tr></table>
    <p style="color:#6b7280;font-size:14px;margin:24px 0 0;text-align:center;">This invitation will expire in 7 days.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
body_html_ar = '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{user_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">قام <strong>{{inviter_name}}</strong> بدعوتك للانضمام إلى <strong>{{org_name}}</strong> بصفتك <strong>{{role}}</strong>.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">انقر على الزر أدناه لقبول هذه الدعوة وإعداد حسابك.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{invitation_url}}" style="display:inline-block;background-color:#6b7280;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">قبول الدعوة</a>
    </td></tr></table>
    <p style="color:#6b7280;font-size:14px;margin:24px 0 0;text-align:center;">ستنتهي صلاحية هذه الدعوة خلال 7 أيام.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'user_invited');

-- ============================================================================
-- 4. USER JOINED
-- ============================================================================
UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">A new member has joined your organization:</p>
    <div style="background-color:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Name:</span></td><td style="color:#374151;padding:8px 0;">{{user_name}}</td></tr>
        <tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Email:</span></td><td style="color:#374151;padding:8px 0;">{{user_email}}</td></tr>
        <tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Role:</span></td><td style="color:#374151;padding:8px 0;">{{role}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">They are now ready to start collaborating with the team.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
body_html_ar = '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">انضم عضو جديد إلى مؤسستكم:</p>
    <div style="background-color:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><span style="color:#1e40af;font-weight:600;">الاسم:</span></td><td style="color:#374151;padding:8px 0;text-align:left;">{{user_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><span style="color:#1e40af;font-weight:600;">البريد الإلكتروني:</span></td><td style="color:#374151;padding:8px 0;text-align:left;">{{user_email}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><span style="color:#1e40af;font-weight:600;">الدور:</span></td><td style="color:#374151;padding:8px 0;text-align:left;">{{role}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0;">أصبح العضو الجديد جاهزاً للتعاون مع الفريق.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'user_joined');

-- ============================================================================
-- 5. APPLICATION RECEIVED
-- ============================================================================
UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Thank you for applying for the <strong>{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">We have received your application and our team will review it shortly. If your qualifications match our requirements, we will be in touch regarding next steps.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">Thank you for your interest in joining our team!</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:24px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
body_html_ar = '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">شكراً لتقديمك على وظيفة <strong>{{job_title}}</strong> في <strong>{{org_name}}</strong>.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">لقد استلمنا طلبك وسيقوم فريقنا بمراجعته قريباً. إذا تطابقت مؤهلاتك مع متطلباتنا، سنتواصل معك بخصوص الخطوات التالية.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0;">شكراً لاهتمامك بالانضمام إلى فريقنا!</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:24px 0 0;">مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'application_received');

-- ============================================================================
-- 6. INTERVIEW SCHEDULED
-- ============================================================================
UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Great news! We would like to invite you to an interview for the <strong>{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Date:</span></td><td style="color:#374151;padding:8px 0;">{{interview_date}}</td></tr>
        <tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Time:</span></td><td style="color:#374151;padding:8px 0;">{{interview_time}}</td></tr>
        <tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Type:</span></td><td style="color:#374151;padding:8px 0;">{{interview_type}}</td></tr>
        <tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Interviewer:</span></td><td style="color:#374151;padding:8px 0;">{{interviewer_name}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 24px;">
      <a href="{{meeting_link}}" style="display:inline-block;background-color:#6b7280;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Join Meeting</a>
    </td></tr></table>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">We look forward to speaking with you!</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
body_html_ar = '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">أخبار سارة! نود دعوتك لإجراء مقابلة لوظيفة <strong>{{job_title}}</strong> في <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><span style="color:#1e40af;font-weight:600;">التاريخ:</span></td><td style="color:#374151;padding:8px 0;text-align:left;">{{interview_date}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><span style="color:#1e40af;font-weight:600;">الوقت:</span></td><td style="color:#374151;padding:8px 0;text-align:left;">{{interview_time}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><span style="color:#1e40af;font-weight:600;">النوع:</span></td><td style="color:#374151;padding:8px 0;text-align:left;">{{interview_type}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><span style="color:#1e40af;font-weight:600;">المحاور:</span></td><td style="color:#374151;padding:8px 0;text-align:left;">{{interviewer_name}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 24px;">
      <a href="{{meeting_link}}" style="display:inline-block;background-color:#6b7280;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">انضم للاجتماع</a>
    </td></tr></table>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0;">نتطلع للتحدث معك!</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'interview_scheduled');

-- ============================================================================
-- 7. OFFER SENT
-- ============================================================================
UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Congratulations! We are pleased to extend an offer for the <strong>{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Salary:</span></td><td style="color:#374151;padding:8px 0;">{{salary}}</td></tr>
        <tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Start Date:</span></td><td style="color:#374151;padding:8px 0;">{{start_date}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 24px;">
      <a href="{{offer_url}}" style="display:inline-block;background-color:#6b7280;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">View Full Offer</a>
    </td></tr></table>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">Please review the offer details and let us know your decision.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
body_html_ar = '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">تهانينا! يسعدنا تقديم عرض عمل لوظيفة <strong>{{job_title}}</strong> في <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><span style="color:#1e40af;font-weight:600;">الوظيفة:</span></td><td style="color:#374151;padding:8px 0;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><span style="color:#1e40af;font-weight:600;">الراتب:</span></td><td style="color:#374151;padding:8px 0;text-align:left;">{{salary}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><span style="color:#1e40af;font-weight:600;">تاريخ البدء:</span></td><td style="color:#374151;padding:8px 0;text-align:left;">{{start_date}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 24px;">
      <a href="{{offer_url}}" style="display:inline-block;background-color:#6b7280;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">عرض التفاصيل الكاملة</a>
    </td></tr></table>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0;">يرجى مراجعة تفاصيل العرض وإعلامنا بقرارك.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'offer_sent');

-- ============================================================================
-- 8. CANDIDATE REJECTION
-- ============================================================================
UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Thank you for your interest in the <strong>{{job_title}}</strong> position at <strong>{{org_name}}</strong> and for taking the time to apply.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">We encourage you to apply for future openings that match your skills and experience. We wish you the best in your career journey.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
body_html_ar = '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
  <tr><td style="background-color:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''">
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">نشكرك على اهتمامك بوظيفة <strong>{{job_title}}</strong> في <strong>{{org_name}}</strong> وعلى الوقت الذي استثمرته في التقديم.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">بعد دراسة متأنية، قررنا المضي قدماً مع مرشحين آخرين تتوافق مؤهلاتهم بشكل أكبر مع احتياجاتنا الحالية.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">نشجعك على التقدم للفرص المستقبلية التي تتناسب مع مهاراتك وخبراتك. نتمنى لك التوفيق في مسيرتك المهنية.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0;">مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'candidate_rejection');
