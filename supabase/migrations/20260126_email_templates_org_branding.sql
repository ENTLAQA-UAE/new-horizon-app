-- ============================================================================
-- EMAIL TEMPLATES WITH ORGANIZATION BRANDING
-- ============================================================================
-- This migration updates all default email templates to use the organization's
-- primary_color variable ({{primary_color}}) instead of hardcoded colors.
-- This ensures all email communications reflect the organization's branding.
-- ============================================================================

-- Helper function to lighten a hex color (for gradients)
-- We'll use CSS calc or provide a lighter shade variable

-- First, let's add secondary_color to organizations if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'secondary_color') THEN
    ALTER TABLE organizations ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#4f46e5';
  END IF;
END $$;

-- ============================================================================
-- UPDATE: INTERVIEW SCHEDULED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Interview Invitation</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We are pleased to invite you for an interview for the <strong style="color:{{primary_color}};">{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f8f9fa;border-left:4px solid {{primary_color}};border-radius:0 8px 8px 0;padding:24px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:10px 0;width:140px;"><strong style="color:{{primary_color}};">📅 Date:</strong></td><td style="color:#374151;">{{interview_date}}</td></tr>
        <tr><td style="padding:10px 0;"><strong style="color:{{primary_color}};">⏰ Time:</strong></td><td style="color:#374151;">{{interview_time}}</td></tr>
        <tr><td style="padding:10px 0;"><strong style="color:{{primary_color}};">📍 Type:</strong></td><td style="color:#374151;">{{interview_type}}</td></tr>
        <tr><td style="padding:10px 0;"><strong style="color:{{primary_color}};">🔗 Location/Link:</strong></td><td style="color:#374151;">{{location}}</td></tr>
        <tr><td style="padding:10px 0;"><strong style="color:{{primary_color}};">👥 Interviewers:</strong></td><td style="color:#374151;">{{interviewers}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Please confirm your attendance by replying to this email. If you need to reschedule, let us know at least 24 hours in advance.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#92400e;font-size:14px;margin:0;"><strong>💡 Tips for your interview:</strong> Be on time, prepare questions about the role, and have a copy of your resume ready.</p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">We look forward to meeting you!<br><br>Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">دعوة لمقابلة</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">يسعدنا دعوتك لإجراء مقابلة لوظيفة <strong style="color:{{primary_color}};">{{job_title}}</strong> في <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f8f9fa;border-right:4px solid {{primary_color}};border-radius:8px 0 0 8px;padding:24px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:10px 0;text-align:right;width:120px;"><strong style="color:{{primary_color}};">📅 التاريخ:</strong></td><td style="color:#374151;text-align:left;">{{interview_date}}</td></tr>
        <tr><td style="padding:10px 0;text-align:right;"><strong style="color:{{primary_color}};">⏰ الوقت:</strong></td><td style="color:#374151;text-align:left;">{{interview_time}}</td></tr>
        <tr><td style="padding:10px 0;text-align:right;"><strong style="color:{{primary_color}};">📍 النوع:</strong></td><td style="color:#374151;text-align:left;">{{interview_type}}</td></tr>
        <tr><td style="padding:10px 0;text-align:right;"><strong style="color:{{primary_color}};">🔗 المكان/الرابط:</strong></td><td style="color:#374151;text-align:left;">{{location}}</td></tr>
        <tr><td style="padding:10px 0;text-align:right;"><strong style="color:{{primary_color}};">👥 المقابلون:</strong></td><td style="color:#374151;text-align:left;">{{interviewers}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">يرجى تأكيد حضورك بالرد على هذا البريد الإلكتروني. إذا كنت بحاجة لإعادة جدولة الموعد، يرجى إعلامنا قبل 24 ساعة على الأقل.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#92400e;font-size:14px;margin:0;text-align:right;"><strong>💡 نصائح للمقابلة:</strong> كن في الموعد، حضّر أسئلة عن الدور، واحتفظ بنسخة من سيرتك الذاتية.</p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">نتطلع للقائك!<br><br>مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'interview_scheduled');

-- ============================================================================
-- UPDATE: INTERVIEW REMINDER - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">⏰ Interview Reminder</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">This is a friendly reminder about your upcoming interview for the <strong style="color:{{primary_color}};">{{job_title}}</strong> position.</p>
    <div style="background-color:#f8f9fa;border:2px solid {{primary_color}};border-radius:12px;padding:30px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;color:{{primary_color}};font-size:14px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Interview</p>
      <p style="margin:0 0 4px;color:#1f2937;font-size:28px;font-weight:700;">{{interview_date}}</p>
      <p style="margin:0;color:{{primary_color}};font-size:20px;font-weight:600;">at {{interview_time}}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
      <p style="margin:0;color:#6b7280;font-size:14px;">{{interview_type}} • {{location}}</p>
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
body_html_ar = '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background-color:{{primary_color}};padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">⏰ تذكير بالمقابلة</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">هذا تذكير ودي بموعد مقابلتك القادمة لوظيفة <strong style="color:{{primary_color}};">{{job_title}}</strong>.</p>
    <div style="background-color:#f8f9fa;border:2px solid {{primary_color}};border-radius:12px;padding:30px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;color:{{primary_color}};font-size:14px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">موعد المقابلة</p>
      <p style="margin:0 0 4px;color:#1f2937;font-size:28px;font-weight:700;">{{interview_date}}</p>
      <p style="margin:0;color:{{primary_color}};font-size:20px;font-weight:600;">الساعة {{interview_time}}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
      <p style="margin:0;color:#6b7280;font-size:14px;">{{interview_type}} • {{location}}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">يرجى التأكد من جاهزيتك قبل الموعد المحدد بدقائق. نتمنى لك التوفيق!</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">نتطلع للتحدث معك!<br><br>مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'interview_reminder');

-- ============================================================================
-- UPDATE: INTERVIEW CANCELLED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Interview Update</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We regret to inform you that your interview for the <strong style="color:{{primary_color}};">{{job_title}}</strong> position has been cancelled.</p>
    <div style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
      <p style="color:#991b1b;font-size:14px;margin:0;">We apologize for any inconvenience this may cause. Our team will be in touch soon regarding next steps.</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">If you have any questions, please don''t hesitate to reach out to us.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">Thank you for your understanding.<br><br>Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تحديث المقابلة</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">نأسف لإبلاغك بأن مقابلتك لوظيفة <strong style="color:{{primary_color}};">{{job_title}}</strong> قد تم إلغاؤها.</p>
    <div style="background-color:#fef2f2;border-right:4px solid #ef4444;border-radius:8px 0 0 8px;padding:20px;margin:24px 0;">
      <p style="color:#991b1b;font-size:14px;margin:0;text-align:right;">نعتذر عن أي إزعاج قد يسببه ذلك. سيتواصل معك فريقنا قريباً بخصوص الخطوات التالية.</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">شكراً لتفهمك.<br><br>مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'interview_cancelled');

-- ============================================================================
-- UPDATE: INTERVIEW RESCHEDULED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Interview Rescheduled</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Your interview for the <strong style="color:{{primary_color}};">{{job_title}}</strong> position has been rescheduled to a new time.</p>
    <div style="background-color:#f8f9fa;border-left:4px solid {{primary_color}};border-radius:0 8px 8px 0;padding:24px;margin:24px 0;">
      <p style="margin:0 0 12px;color:{{primary_color}};font-size:14px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">New Schedule</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;width:100px;"><strong style="color:{{primary_color}};">📅 Date:</strong></td><td style="color:#374151;font-weight:600;">{{interview_date}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">⏰ Time:</strong></td><td style="color:#374151;font-weight:600;">{{interview_time}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">📍 Type:</strong></td><td style="color:#374151;">{{interview_type}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">🔗 Location:</strong></td><td style="color:#374151;">{{location}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Please confirm your availability for the new time by replying to this email.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">We apologize for any inconvenience and look forward to meeting you!<br><br>Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم إعادة جدولة المقابلة</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم إعادة جدولة مقابلتك لوظيفة <strong style="color:{{primary_color}};">{{job_title}}</strong> إلى موعد جديد.</p>
    <div style="background-color:#f8f9fa;border-right:4px solid {{primary_color}};border-radius:8px 0 0 8px;padding:24px;margin:24px 0;">
      <p style="margin:0 0 12px;color:{{primary_color}};font-size:14px;text-transform:uppercase;letter-spacing:1px;font-weight:600;text-align:right;">الموعد الجديد</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;width:100px;"><strong style="color:{{primary_color}};">📅 التاريخ:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{interview_date}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">⏰ الوقت:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{interview_time}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">📍 النوع:</strong></td><td style="color:#374151;text-align:left;">{{interview_type}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">🔗 المكان:</strong></td><td style="color:#374151;text-align:left;">{{location}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">يرجى تأكيد توفرك في الموعد الجديد بالرد على هذا البريد الإلكتروني.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">نعتذر عن أي إزعاج ونتطلع للقائك!<br><br>مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'interview_rescheduled');

-- ============================================================================
-- UPDATE: USER INVITED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">You''re Invited! 🎉</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{receiver_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;"><strong>{{inviter_name}}</strong> has invited you to join <strong style="color:{{primary_color}};">{{org_name}}</strong> as a <strong>{{role}}</strong>.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Click the button below to accept this invitation and set up your account.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:{{primary_color}};border-radius:8px;">
          <a href="{{invitation_url}}" style="display:inline-block;padding:16px 40px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">Accept Invitation</a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">This invitation will expire in 7 days. If the button doesn''t work, copy and paste this link:<br><a href="{{invitation_url}}" style="color:{{primary_color}};word-break:break-all;">{{invitation_url}}</a></p>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">أنت مدعو! 🎉</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{receiver_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">قام <strong>{{inviter_name}}</strong> بدعوتك للانضمام إلى <strong style="color:{{primary_color}};">{{org_name}}</strong> بصفتك <strong>{{role}}</strong>.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">اضغط على الزر أدناه لقبول الدعوة وإعداد حسابك.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:{{primary_color}};border-radius:8px;">
          <a href="{{invitation_url}}" style="display:inline-block;padding:16px 40px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">قبول الدعوة</a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0;text-align:right;">ستنتهي صلاحية هذه الدعوة خلال 7 أيام. إذا لم يعمل الزر، انسخ والصق هذا الرابط:<br><a href="{{invitation_url}}" style="color:{{primary_color}};word-break:break-all;">{{invitation_url}}</a></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'user_invited');

-- ============================================================================
-- UPDATE: OFFER SENT - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">🎉 Job Offer</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Congratulations! We are thrilled to extend an offer for the <strong style="color:{{primary_color}};">{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:24px;margin:24px 0;">
      <p style="margin:0 0 12px;color:#15803d;font-size:14px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Offer Details</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;width:120px;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;font-weight:600;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Salary:</strong></td><td style="color:#374151;font-weight:600;">{{salary}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Start Date:</strong></td><td style="color:#374151;">{{start_date}}</td></tr>
      </table>
    </div>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:{{primary_color}};border-radius:8px;">
          <a href="{{offer_url}}" style="display:inline-block;padding:16px 40px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">View Full Offer</a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Please review the complete offer details using the button above. We look forward to welcoming you to our team!</p>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">🎉 عرض وظيفي</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تهانينا! يسعدنا أن نقدم لك عرضاً لوظيفة <strong style="color:{{primary_color}};">{{job_title}}</strong> في <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f0fdf4;border-right:4px solid #22c55e;border-radius:8px 0 0 8px;padding:24px;margin:24px 0;">
      <p style="margin:0 0 12px;color:#15803d;font-size:14px;text-transform:uppercase;letter-spacing:1px;font-weight:600;text-align:right;">تفاصيل العرض</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;width:100px;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الراتب:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{salary}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">تاريخ البدء:</strong></td><td style="color:#374151;text-align:left;">{{start_date}}</td></tr>
      </table>
    </div>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:{{primary_color}};border-radius:8px;">
          <a href="{{offer_url}}" style="display:inline-block;padding:16px 40px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">عرض التفاصيل الكاملة</a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">يرجى مراجعة تفاصيل العرض الكاملة باستخدام الزر أعلاه. نتطلع للترحيب بك في فريقنا!</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'offer_sent');

-- ============================================================================
-- UPDATE: APPLICATION RECEIVED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Application Received ✓</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Thank you for applying to the <strong style="color:{{primary_color}};">{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f8f9fa;border-left:4px solid {{primary_color}};border-radius:0 8px 8px 0;padding:20px;margin:24px 0;">
      <p style="color:#374151;font-size:14px;margin:0;">We have received your application and our recruitment team will review it carefully. If your qualifications match our requirements, we will contact you for the next steps.</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">In the meantime, you can:</p>
    <ul style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;padding-left:20px;">
      <li>Explore other opportunities on our careers page</li>
      <li>Follow us on social media for company updates</li>
      <li>Prepare for potential interviews by researching our company</li>
    </ul>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">Thank you for your interest in joining our team!<br><br>Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم استلام طلبك ✓</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">شكراً لتقدمك لوظيفة <strong style="color:{{primary_color}};">{{job_title}}</strong> في <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f8f9fa;border-right:4px solid {{primary_color}};border-radius:8px 0 0 8px;padding:20px;margin:24px 0;">
      <p style="color:#374151;font-size:14px;margin:0;text-align:right;">لقد استلمنا طلبك وسيقوم فريق التوظيف لدينا بمراجعته بعناية. إذا تطابقت مؤهلاتك مع متطلباتنا، سنتواصل معك للخطوات التالية.</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">في هذه الأثناء، يمكنك:</p>
    <ul style="color:#6b7280;font-size:14px;line-height:2;margin:0 0 20px;padding-right:20px;">
      <li>استكشاف فرص أخرى على صفحة الوظائف لدينا</li>
      <li>متابعتنا على وسائل التواصل الاجتماعي للحصول على آخر أخبار الشركة</li>
      <li>التحضير للمقابلات المحتملة من خلال البحث عن شركتنا</li>
    </ul>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">شكراً لاهتمامك بالانضمام إلى فريقنا!<br><br>مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'application_received');

-- ============================================================================
-- UPDATE: ROLE CHANGED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Role Updated</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{receiver_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Your role at <strong style="color:{{primary_color}};">{{org_name}}</strong> has been updated.</p>
    <div style="background-color:#f8f9fa;border-left:4px solid {{primary_color}};border-radius:0 8px 8px 0;padding:24px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;width:120px;"><strong style="color:#6b7280;">Previous Role:</strong></td><td style="color:#374151;">{{old_role}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">New Role:</strong></td><td style="color:#374151;font-weight:600;">{{new_role}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#6b7280;">Changed by:</strong></td><td style="color:#374151;">{{changed_by}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Your access permissions have been updated accordingly. If you have any questions about your new role, please contact your administrator.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:20px 0 0;">Best regards,<br><strong>{{org_name}} Team</strong></p>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم تحديث الدور</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{receiver_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم تحديث دورك في <strong style="color:{{primary_color}};">{{org_name}}</strong>.</p>
    <div style="background-color:#f8f9fa;border-right:4px solid {{primary_color}};border-radius:8px 0 0 8px;padding:24px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;width:120px;"><strong style="color:#6b7280;">الدور السابق:</strong></td><td style="color:#374151;text-align:left;">{{old_role}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الدور الجديد:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{new_role}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#6b7280;">تم التغيير بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{changed_by}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">تم تحديث صلاحيات وصولك وفقاً لذلك. إذا كان لديك أي استفسارات حول دورك الجديد، يرجى التواصل مع المسؤول.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:20px 0 0;">مع أطيب التحيات،<br><strong>فريق {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'role_changed');

-- Add comment
COMMENT ON TABLE default_email_templates IS 'Email templates now use {{primary_color}} for org branding - updated 2026-01-26';
