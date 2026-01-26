-- Migration: Update email templates to use organization branding colors
-- This migration updates all default email templates to use {{primary_color}} and {{secondary_color}}
-- instead of hardcoded colors, ensuring emails match the organization's branding.

-- Delete existing default templates and recreate with dynamic org branding colors
DELETE FROM default_email_templates;

-- Insert professional email templates with org branding colors
INSERT INTO default_email_templates (event_id, subject, subject_ar, body_html, body_html_ar)
SELECT
  id,
  -- English Subjects
  CASE code
    WHEN 'user_invited' THEN 'You''ve been invited to join {{org_name}}'
    WHEN 'user_joined' THEN 'Welcome to {{org_name}}!'
    WHEN 'password_reset' THEN 'Reset your password'
    WHEN 'role_changed' THEN 'Your role has been updated at {{org_name}}'
    WHEN 'new_application' THEN 'New application received: {{candidate_name}} for {{job_title}}'
    WHEN 'application_received' THEN 'Thank you for your application - {{job_title}}'
    WHEN 'candidate_stage_moved' THEN 'Application update for {{candidate_name}}'
    WHEN 'candidate_disqualified' THEN 'Application status update for {{candidate_name}}'
    WHEN 'candidate_rejection' THEN 'Update on your application for {{job_title}}'
    WHEN 'interview_scheduled' THEN 'Interview invitation - {{job_title}}'
    WHEN 'interview_reminder' THEN 'Interview reminder - Tomorrow at {{interview_time}}'
    WHEN 'interview_cancelled' THEN 'Interview cancelled - {{job_title}}'
    WHEN 'interview_rescheduled' THEN 'Interview rescheduled - {{job_title}}'
    WHEN 'scorecard_submitted' THEN 'New scorecard submitted for {{candidate_name}}'
    WHEN 'scorecard_reminder' THEN 'Please submit your interview feedback'
    WHEN 'offer_created' THEN 'New offer created for {{candidate_name}}'
    WHEN 'offer_sent' THEN 'Job offer from {{org_name}} - {{job_title}}'
    WHEN 'offer_accepted' THEN 'Great news! {{candidate_name}} accepted the offer'
    WHEN 'offer_rejected' THEN '{{candidate_name}} has declined the offer'
    WHEN 'offer_expired' THEN 'Offer expired for {{candidate_name}}'
    WHEN 'job_published' THEN 'Job published: {{job_title}}'
    WHEN 'job_closed' THEN 'Job closed: {{job_title}}'
    WHEN 'job_expiring' THEN 'Job posting expiring soon: {{job_title}}'
    WHEN 'requisition_created' THEN 'New requisition submitted: {{job_title}}'
    WHEN 'requisition_approved' THEN 'Requisition approved: {{job_title}}'
    WHEN 'requisition_rejected' THEN 'Requisition rejected: {{job_title}}'
    ELSE name
  END,
  -- Arabic Subjects
  CASE code
    WHEN 'user_invited' THEN 'دعوة للانضمام إلى {{org_name}}'
    WHEN 'user_joined' THEN 'مرحباً بك في {{org_name}}!'
    WHEN 'password_reset' THEN 'إعادة تعيين كلمة المرور'
    WHEN 'role_changed' THEN 'تم تحديث دورك في {{org_name}}'
    WHEN 'new_application' THEN 'طلب جديد: {{candidate_name}} لوظيفة {{job_title}}'
    WHEN 'application_received' THEN 'شكراً على تقديمك - {{job_title}}'
    WHEN 'candidate_stage_moved' THEN 'تحديث الطلب: {{candidate_name}}'
    WHEN 'candidate_disqualified' THEN 'تحديث حالة الطلب: {{candidate_name}}'
    WHEN 'candidate_rejection' THEN 'تحديث بخصوص طلبك لوظيفة {{job_title}}'
    WHEN 'interview_scheduled' THEN 'دعوة لمقابلة - {{job_title}}'
    WHEN 'interview_reminder' THEN 'تذكير بالمقابلة - غداً الساعة {{interview_time}}'
    WHEN 'interview_cancelled' THEN 'إلغاء المقابلة - {{job_title}}'
    WHEN 'interview_rescheduled' THEN 'تغيير موعد المقابلة - {{job_title}}'
    WHEN 'scorecard_submitted' THEN 'تقييم جديد لـ {{candidate_name}}'
    WHEN 'scorecard_reminder' THEN 'يرجى تقديم تقييم المقابلة'
    WHEN 'offer_created' THEN 'عرض جديد لـ {{candidate_name}}'
    WHEN 'offer_sent' THEN 'عرض وظيفي من {{org_name}} - {{job_title}}'
    WHEN 'offer_accepted' THEN 'أخبار رائعة! قبل {{candidate_name}} العرض'
    WHEN 'offer_rejected' THEN 'رفض {{candidate_name}} العرض'
    WHEN 'offer_expired' THEN 'انتهت صلاحية العرض: {{candidate_name}}'
    WHEN 'job_published' THEN 'تم نشر الوظيفة: {{job_title}}'
    WHEN 'job_closed' THEN 'تم إغلاق الوظيفة: {{job_title}}'
    WHEN 'job_expiring' THEN 'الوظيفة ستنتهي قريباً: {{job_title}}'
    WHEN 'requisition_created' THEN 'طلب توظيف جديد: {{job_title}}'
    WHEN 'requisition_approved' THEN 'تمت الموافقة على طلب التوظيف: {{job_title}}'
    WHEN 'requisition_rejected' THEN 'تم رفض طلب التوظيف: {{job_title}}'
    ELSE name_ar
  END,
  -- English HTML Body with org branding colors
  CASE code
    -- USER INVITATION
    WHEN 'user_invited' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">You''re Invited!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{{receiver_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;"><strong>{{inviter_name}}</strong> has invited you to join <strong>{{org_name}}</strong> as a <strong style="color:{{primary_color}};">{{role}}</strong>.</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 30px;">Join the team and start collaborating on our recruitment platform.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{invitation_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Accept Invitation</a>
    </td></tr></table>
    <p style="color:#9ca3af;font-size:13px;margin:30px 0 0;text-align:center;">This invitation expires in 7 days.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- USER JOINED
    WHEN 'user_joined' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">New Team Member!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new member has joined your organization:</p>
    <div style="background-color:#f0fdf4;border:1px solid {{primary_color}};border-radius:8px;padding:20px;margin:0 0 20px;">
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
</body></html>'

    -- PASSWORD RESET
    WHEN 'password_reset' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Password Reset</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{{user_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We received a request to reset your password. Click the button below to create a new password:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{reset_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Reset Password</a>
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
</body></html>'

    -- ROLE CHANGED
    WHEN 'role_changed' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Role Updated</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{{user_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Your role has been updated by <strong>{{changed_by}}</strong>:</p>
    <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin:30px 0;">
      <div style="background-color:#fee2e2;padding:12px 24px;border-radius:8px;">
        <p style="margin:0;color:#991b1b;font-size:12px;">Previous Role</p>
        <p style="margin:4px 0 0;color:#dc2626;font-weight:600;">{{old_role}}</p>
      </div>
      <span style="color:#9ca3af;font-size:24px;">→</span>
      <div style="background-color:#dcfce7;padding:12px 24px;border-radius:8px;">
        <p style="margin:0;color:#166534;font-size:12px;">New Role</p>
        <p style="margin:4px 0 0;color:#16a34a;font-weight:600;">{{new_role}}</p>
      </div>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;text-align:center;">Your permissions have been updated accordingly.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- NEW APPLICATION (to recruiters)
    WHEN 'new_application' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">New Application</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new candidate has applied!</p>
    <div style="background-color:#f3f4f6;border:1px solid {{primary_color}};border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">Candidate:</strong> <span style="color:#374151;">{{candidate_name}}</span></p>
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">Position:</strong> <span style="color:#374151;">{{job_title}}</span></p>
      <p style="margin:0;"><strong style="color:{{primary_color}};">Applied:</strong> <span style="color:#374151;">{{application_date}}</span></p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{application_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Review Application</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- APPLICATION RECEIVED (to candidate)
    WHEN 'application_received' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Application Received!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Thank you for applying for the <strong style="color:{{primary_color}};">{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 30px;">We have received your application and our recruitment team will review it carefully. If your qualifications match our requirements, we will contact you for the next steps.</p>
    <div style="background-color:#f3f4f6;border:1px solid {{primary_color}};border-radius:8px;padding:20px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 12px;color:{{primary_color}};font-weight:600;">What happens next?</p>
      <p style="margin:0;color:#6b7280;font-size:14px;">Our team will review your application within 5-7 business days.</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{portal_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Track Your Application</a>
    </td></tr></table>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:30px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- CANDIDATE REJECTION
    WHEN 'candidate_rejection' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Application Update</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Thank you for your interest in the <strong>{{job_title}}</strong> position at <strong>{{org_name}}</strong> and for taking the time to apply.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We encourage you to apply for future positions that match your skills and experience. We wish you the best in your job search.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:30px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- INTERVIEW SCHEDULED
    WHEN 'interview_scheduled' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Interview Invitation</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We are pleased to invite you for an interview for the <strong style="color:{{primary_color}};">{{job_title}}</strong> position.</p>
    <div style="background-color:#f3f4f6;border:1px solid {{primary_color}};border-radius:8px;padding:24px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">📅 Date:</strong></td><td style="color:#374151;">{{interview_date}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">⏰ Time:</strong></td><td style="color:#374151;">{{interview_time}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">📍 Type:</strong></td><td style="color:#374151;">{{interview_type}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">🔗 Location/Link:</strong></td><td style="color:#374151;">{{location}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">👥 Interviewers:</strong></td><td style="color:#374151;">{{interviewers}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Please confirm your attendance by replying to this email. If you need to reschedule, let us know at least 24 hours in advance.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- INTERVIEW REMINDER
    WHEN 'interview_reminder' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Interview Reminder</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">This is a friendly reminder about your upcoming interview for the <strong style="color:{{primary_color}};">{{job_title}}</strong> position.</p>
    <div style="background-color:#f3f4f6;border:1px solid {{primary_color}};border-radius:8px;padding:24px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 8px;color:{{primary_color}};font-size:14px;">Your interview is scheduled for:</p>
      <p style="margin:0;color:#374151;font-size:24px;font-weight:600;">{{interview_date}} at {{interview_time}}</p>
      <p style="margin:12px 0 0;color:#6b7280;">{{location}}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Good luck! We look forward to meeting you.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- INTERVIEW CANCELLED
    WHEN 'interview_cancelled' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Interview Cancelled</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We regret to inform you that your scheduled interview for the <strong>{{job_title}}</strong> position has been cancelled.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Our team will be in touch with you shortly regarding next steps or to reschedule.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We apologize for any inconvenience this may cause.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- INTERVIEW RESCHEDULED
    WHEN 'interview_rescheduled' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Interview Rescheduled</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Your interview for the <strong style="color:{{primary_color}};">{{job_title}}</strong> position has been rescheduled.</p>
    <div style="background-color:#f3f4f6;border:1px solid {{primary_color}};border-radius:8px;padding:24px;margin:20px 0;">
      <p style="margin:0 0 8px;color:{{primary_color}};font-weight:600;">New Interview Details:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">📅 Date:</strong></td><td style="color:#374151;">{{interview_date}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">⏰ Time:</strong></td><td style="color:#374151;">{{interview_time}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">📍 Type:</strong></td><td style="color:#374151;">{{interview_type}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">🔗 Location/Link:</strong></td><td style="color:#374151;">{{location}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">We apologize for any inconvenience. Please confirm your availability for the new time.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- SCORECARD SUBMITTED
    WHEN 'scorecard_submitted' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Scorecard Submitted</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new scorecard has been submitted for <strong>{{candidate_name}}</strong>.</p>
    <div style="background-color:#f3f4f6;border:1px solid {{primary_color}};border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">Interviewer:</strong> <span style="color:#374151;">{{interviewer_name}}</span></p>
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">Position:</strong> <span style="color:#374151;">{{job_title}}</span></p>
      <p style="margin:0;"><strong style="color:{{primary_color}};">Score:</strong> <span style="color:#374151;">{{score}}</span></p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{scorecard_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Scorecard</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- SCORECARD REMINDER
    WHEN 'scorecard_reminder' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Scorecard Reminder</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{{receiver_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Please submit your interview feedback for <strong>{{candidate_name}}</strong> for the <strong style="color:{{primary_color}};">{{job_title}}</strong> position.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:0 0 20px;text-align:center;">
      <p style="margin:0;color:#92400e;font-size:14px;">Your feedback helps make better hiring decisions!</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{scorecard_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Submit Scorecard</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- OFFER CREATED
    WHEN 'offer_created' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Offer Created</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new offer has been created for <strong>{{candidate_name}}</strong>.</p>
    <div style="background-color:#f3f4f6;border:1px solid {{primary_color}};border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">Candidate:</strong> <span style="color:#374151;">{{candidate_name}}</span></p>
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">Position:</strong> <span style="color:#374151;">{{job_title}}</span></p>
      <p style="margin:0;"><strong style="color:{{primary_color}};">Salary:</strong> <span style="color:#374151;">{{salary}}</span></p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{offer_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Review Offer</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- OFFER SENT
    WHEN 'offer_sent' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Job Offer</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Congratulations! We are thrilled to extend an offer for the <strong style="color:{{primary_color}};">{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">After careful consideration, we believe you would be a great addition to our team. Please review the offer details below:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{offer_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Offer Details</a>
    </td></tr></table>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
      <p style="margin:0;color:#92400e;font-size:14px;">This offer expires on <strong>{{expiry_date}}</strong></p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">We hope you''ll accept and join our team!<br><br>Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- OFFER ACCEPTED
    WHEN 'offer_accepted' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Offer Accepted!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Great news!</p>
    <div style="background-color:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:24px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 8px;color:#166534;font-size:18px;font-weight:600;">{{candidate_name}}</p>
      <p style="margin:0;color:#166534;">has accepted the offer for <strong>{{job_title}}</strong></p>
    </div>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;">
      <p style="margin:0;"><strong style="color:#166534;">Start Date:</strong> <span style="color:#374151;">{{start_date}}</span></p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:20px 0 0;">Please begin the onboarding process to ensure everything is ready for their first day.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- OFFER REJECTED
    WHEN 'offer_rejected' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Offer Declined</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Unfortunately, <strong>{{candidate_name}}</strong> has declined the offer for the <strong>{{job_title}}</strong> position.</p>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;"><strong style="color:#991b1b;">Candidate:</strong> <span style="color:#374151;">{{candidate_name}}</span></p>
      <p style="margin:0;"><strong style="color:#991b1b;">Position:</strong> <span style="color:#374151;">{{job_title}}</span></p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">You may want to consider other candidates for this position.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- OFFER EXPIRED
    WHEN 'offer_expired' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Offer Expired</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">The offer for <strong>{{candidate_name}}</strong> for the <strong>{{job_title}}</strong> position has expired.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;"><strong style="color:#92400e;">Candidate:</strong> <span style="color:#374151;">{{candidate_name}}</span></p>
      <p style="margin:0;"><strong style="color:#92400e;">Position:</strong> <span style="color:#374151;">{{job_title}}</span></p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">You can extend the offer or consider other candidates.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- JOB PUBLISHED
    WHEN 'job_published' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Job Published</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new job has been published and is now accepting applications.</p>
    <div style="background-color:#f3f4f6;border:1px solid {{primary_color}};border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">Position:</strong> <span style="color:#374151;">{{job_title}}</span></p>
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">Department:</strong> <span style="color:#374151;">{{department}}</span></p>
      <p style="margin:0;"><strong style="color:{{primary_color}};">Location:</strong> <span style="color:#374151;">{{location}}</span></p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Job</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- JOB CLOSED
    WHEN 'job_closed' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Job Closed</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">The following job posting has been closed:</p>
    <div style="background-color:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 20px;text-align:center;">
      <p style="margin:0;color:#374151;font-size:18px;font-weight:600;">{{job_title}}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">This job is no longer accepting new applications.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- JOB EXPIRING
    WHEN 'job_expiring' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Job Expiring Soon</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">The following job posting will expire soon:</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:20px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 8px;color:#374151;font-size:18px;font-weight:600;">{{job_title}}</p>
      <p style="margin:0;color:#92400e;font-size:14px;">Expires on <strong>{{expiry_date}}</strong></p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Extend Job Posting</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- REQUISITION CREATED
    WHEN 'requisition_created' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">New Requisition</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new requisition has been submitted for review.</p>
    <div style="background-color:#f3f4f6;border:1px solid {{primary_color}};border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">Position:</strong> <span style="color:#374151;">{{job_title}}</span></p>
      <p style="margin:0 0 8px;"><strong style="color:{{primary_color}};">Department:</strong> <span style="color:#374151;">{{department}}</span></p>
      <p style="margin:0;"><strong style="color:{{primary_color}};">Requested by:</strong> <span style="color:#374151;">{{requester_name}}</span></p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{requisition_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Review Requisition</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- REQUISITION APPROVED
    WHEN 'requisition_approved' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Requisition Approved</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Your requisition has been approved!</p>
    <div style="background-color:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:20px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 8px;color:#166534;font-size:18px;font-weight:600;">{{job_title}}</p>
      <p style="margin:0;color:#166534;">Status: <strong>Approved</strong></p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">You can now proceed to create and publish the job posting.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{requisition_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Create Job Posting</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- REQUISITION REJECTED
    WHEN 'requisition_rejected' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Requisition Rejected</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Your requisition has been rejected.</p>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 8px;color:#991b1b;font-size:18px;font-weight:600;">{{job_title}}</p>
      <p style="margin:0;color:#991b1b;">Status: <strong>Rejected</strong></p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Please contact your manager for more details or to discuss next steps.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- CANDIDATE STAGE MOVED
    WHEN 'candidate_stage_moved' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Application Update</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Your application for the <strong style="color:{{primary_color}};">{{job_title}}</strong> position at <strong>{{org_name}}</strong> has progressed to the next stage.</p>
    <div style="background-color:#f3f4f6;border:1px solid {{primary_color}};border-radius:8px;padding:20px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 8px;color:{{primary_color}};font-size:14px;">Current Stage:</p>
      <p style="margin:0;color:#374151;font-size:18px;font-weight:600;">{{stage_name}}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Our team will be in touch with you soon regarding next steps. Thank you for your patience!</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- CANDIDATE DISQUALIFIED
    WHEN 'candidate_disqualified' THEN '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Application Update</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Thank you for your interest in the <strong>{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">After reviewing your application, we''ve decided not to move forward at this time. We encourage you to apply for other positions that match your skills and experience.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">We wish you the best in your job search.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'

    -- Default fallback
    ELSE '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Notification</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">You have a new notification from {{org_name}}.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
  END,
  -- Arabic HTML Body (RTL) with org branding colors
  CASE code
    WHEN 'user_invited' THEN '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">دعوة للانضمام</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{receiver_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">قام <strong>{{inviter_name}}</strong> بدعوتك للانضمام إلى <strong>{{org_name}}</strong> بصفة <strong style="color:{{primary_color}};">{{role}}</strong>.</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 30px;">انضم إلى الفريق وابدأ التعاون على منصة التوظيف.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{invitation_url}}" style="display:inline-block;background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">قبول الدعوة</a>
    </td></tr></table>
    <p style="color:#9ca3af;font-size:13px;margin:30px 0 0;text-align:center;">تنتهي صلاحية هذه الدعوة خلال 7 أيام.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
    ELSE '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">إشعار</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0;">لديك إشعار جديد من {{org_name}}.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
  END
FROM notification_events
WHERE is_system = true;
