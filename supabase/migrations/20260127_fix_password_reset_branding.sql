-- ============================================================================
-- FIX PASSWORD RESET EMAIL TEMPLATE - USE ORG BRANDING COLORS
-- ============================================================================
-- This migration updates the password_reset email template to use {{primary_color}}
-- variable instead of hardcoded orange colors.
-- ============================================================================

UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background-color:{{primary_color}};padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Password Reset</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{{user_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We received a request to reset your password. Click the button below to create a new password:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{reset_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Reset Password</a>
    </td></tr></table>
    <p style="color:{{primary_color}};font-size:14px;margin:20px 0;text-align:center;">This link expires in {{expiry_time}}.</p>
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
body_html_ar = '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background-color:{{primary_color}};padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">إعادة تعيين كلمة المرور</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{user_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{reset_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">إعادة تعيين كلمة المرور</a>
    </td></tr></table>
    <p style="color:{{primary_color}};font-size:14px;margin:20px 0;text-align:center;">تنتهي صلاحية هذا الرابط خلال {{expiry_time}}.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin-top:20px;">
      <p style="color:#92400e;font-size:13px;margin:0;text-align:right;">إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني أو التواصل مع الدعم.</p>
    </div>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'password_reset');
