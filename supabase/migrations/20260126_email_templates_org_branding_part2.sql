-- ============================================================================
-- EMAIL TEMPLATES WITH ORGANIZATION BRANDING - PART 2
-- ============================================================================
-- This migration updates the remaining 18 email templates to use {{primary_color}}
-- Templates already covered in part 1: interview_scheduled, interview_reminder,
-- interview_cancelled, interview_rescheduled, user_invited, offer_sent,
-- application_received, role_changed
-- ============================================================================

-- ============================================================================
-- 1. USER JOINED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">New Team Member!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new member has joined your organization:</p>
    <div style="background-color:#f8f9fa;border-left:4px solid {{primary_color}};border-radius:0 8px 8px 0;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">Name:</strong> <span style="color:#374151;">{{user_name}}</span></p>
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">Email:</strong> <span style="color:#374151;">{{user_email}}</span></p>
      <p style="margin:0;"><strong style="color:{{primary_color}};">Role:</strong> <span style="color:#374151;">{{role}}</span></p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">They are now ready to start collaborating with the team.</p>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">عضو جديد في الفريق!</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">انضم عضو جديد إلى مؤسستكم:</p>
    <div style="background-color:#f8f9fa;border-right:4px solid {{primary_color}};border-radius:8px 0 0 8px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">الاسم:</strong> <span style="color:#374151;">{{user_name}}</span></p>
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">البريد الإلكتروني:</strong> <span style="color:#374151;">{{user_email}}</span></p>
      <p style="margin:0;"><strong style="color:{{primary_color}};">الدور:</strong> <span style="color:#374151;">{{role}}</span></p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0;">أصبح العضو الجديد جاهزاً للتعاون مع الفريق.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'user_joined');

-- ============================================================================
-- 2. PASSWORD RESET - Use org branding
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
    <p style="color:#ef4444;font-size:14px;margin:20px 0;text-align:center;">تنتهي صلاحية هذا الرابط خلال {{expiry_time}}.</p>
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

-- ============================================================================
-- 3. NEW APPLICATION - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">New Application Received</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new candidate has applied for an open position!</p>
    <div style="background-color:#f8f9fa;border-left:4px solid {{primary_color}};border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Applied:</strong></td><td style="color:#374151;">{{application_date}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Review Application</a>
    </td></tr></table>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم استلام طلب جديد</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تقدم مرشح جديد لوظيفة شاغرة!</p>
    <div style="background-color:#f8f9fa;border-right:4px solid {{primary_color}};border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">تاريخ التقديم:</strong></td><td style="color:#374151;text-align:left;">{{application_date}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">مراجعة الطلب</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'new_application');

-- ============================================================================
-- 4. CANDIDATE STAGE MOVED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Pipeline Update</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A candidate has been moved to a new stage in the hiring pipeline.</p>
    <div style="background-color:#f8f9fa;border-left:4px solid {{primary_color}};border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#6b7280;">Previous Stage:</strong></td><td style="color:#374151;">{{previous_stage}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">New Stage:</strong></td><td style="color:#374151;font-weight:600;">{{new_stage}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#6b7280;">Moved by:</strong></td><td style="color:#374151;">{{moved_by}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Candidate</a>
    </td></tr></table>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تحديث مسار التوظيف</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم نقل مرشح إلى مرحلة جديدة في مسار التوظيف.</p>
    <div style="background-color:#f8f9fa;border-right:4px solid {{primary_color}};border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#6b7280;">المرحلة السابقة:</strong></td><td style="color:#374151;text-align:left;">{{previous_stage}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">المرحلة الجديدة:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{new_stage}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#6b7280;">تم النقل بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{moved_by}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض المرشح</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'candidate_stage_moved');

-- ============================================================================
-- 5. CANDIDATE DISQUALIFIED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Candidate Disqualified</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A candidate has been disqualified from the hiring process.</p>
    <div style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Reason:</strong></td><td style="color:#374151;">{{disqualification_reason}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#6b7280;">Disqualified by:</strong></td><td style="color:#374151;">{{disqualified_by}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Details</a>
    </td></tr></table>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم استبعاد المرشح</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم استبعاد مرشح من عملية التوظيف.</p>
    <div style="background-color:#fef2f2;border-right:4px solid #ef4444;border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">السبب:</strong></td><td style="color:#374151;text-align:left;">{{disqualification_reason}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#6b7280;">تم الاستبعاد بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{disqualified_by}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض التفاصيل</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'candidate_disqualified');

-- ============================================================================
-- 6. CANDIDATE REJECTION - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Application Update</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Thank you for your interest in the <strong style="color:{{primary_color}};">{{job_title}}</strong> position at <strong>{{org_name}}</strong> and for taking the time to apply.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
    <div style="background-color:#f8f9fa;border-left:4px solid {{primary_color}};border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
      <p style="color:#374151;font-size:14px;margin:0;">We encourage you to apply for future openings that match your skills and experience. We wish you the best in your career journey.</p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تحديث الطلب</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">نشكرك على اهتمامك بوظيفة <strong style="color:{{primary_color}};">{{job_title}}</strong> في <strong>{{org_name}}</strong> وعلى الوقت الذي استثمرته في التقديم.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">بعد دراسة متأنية، قررنا المضي قدماً مع مرشحين آخرين تتوافق مؤهلاتهم بشكل أكبر مع احتياجاتنا الحالية.</p>
    <div style="background-color:#f8f9fa;border-right:4px solid {{primary_color}};border-radius:8px 0 0 8px;padding:20px;margin:24px 0;">
      <p style="color:#374151;font-size:14px;margin:0;text-align:right;">نشجعك على التقدم للفرص المستقبلية التي تتناسب مع مهاراتك وخبراتك. نتمنى لك التوفيق في مسيرتك المهنية.</p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'candidate_rejection');
