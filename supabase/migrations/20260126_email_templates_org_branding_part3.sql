-- ============================================================================
-- EMAIL TEMPLATES WITH ORGANIZATION BRANDING - PART 3
-- ============================================================================
-- Remaining templates: scorecard, offers, jobs, requisitions
-- ============================================================================

-- ============================================================================
-- 7. SCORECARD SUBMITTED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Scorecard Submitted</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new scorecard has been submitted for review.</p>
    <div style="background-color:#f8f9fa;border-left:4px solid {{primary_color}};border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Interviewer:</strong></td><td style="color:#374151;">{{interviewer_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Overall Rating:</strong></td><td style="color:#374151;font-weight:600;">{{overall_rating}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{scorecard_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Scorecard</a>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم تقديم بطاقة التقييم</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم تقديم بطاقة تقييم جديدة للمراجعة.</p>
    <div style="background-color:#f8f9fa;border-right:4px solid {{primary_color}};border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">المُقابِل:</strong></td><td style="color:#374151;text-align:left;">{{interviewer_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">التقييم العام:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{overall_rating}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{scorecard_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض بطاقة التقييم</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'scorecard_submitted');

-- ============================================================================
-- 8. SCORECARD REMINDER - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">⏰ Scorecard Reminder</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{interviewer_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">This is a reminder to submit your scorecard for the following interview:</p>
    <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#b45309;">Interview Date:</strong></td><td style="color:#374151;">{{interview_date}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{scorecard_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Submit Scorecard</a>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">⏰ تذكير بطاقة التقييم</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{interviewer_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">هذا تذكير لتقديم بطاقة التقييم للمقابلة التالية:</p>
    <div style="background-color:#fef3c7;border-right:4px solid #f59e0b;border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#b45309;">تاريخ المقابلة:</strong></td><td style="color:#374151;text-align:left;">{{interview_date}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{scorecard_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">تقديم بطاقة التقييم</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'scorecard_reminder');

-- ============================================================================
-- 9. OFFER CREATED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">New Offer Created</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new job offer has been created and is pending approval.</p>
    <div style="background-color:#f8f9fa;border-left:4px solid {{primary_color}};border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Salary:</strong></td><td style="color:#374151;font-weight:600;">{{salary}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Start Date:</strong></td><td style="color:#374151;">{{start_date}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#6b7280;">Created by:</strong></td><td style="color:#374151;">{{created_by}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{offer_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Review Offer</a>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم إنشاء عرض جديد</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم إنشاء عرض وظيفي جديد وهو بانتظار الموافقة.</p>
    <div style="background-color:#f8f9fa;border-right:4px solid {{primary_color}};border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الراتب:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{salary}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">تاريخ البدء:</strong></td><td style="color:#374151;text-align:left;">{{start_date}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#6b7280;">تم الإنشاء بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{created_by}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{offer_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">مراجعة العرض</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'offer_created');

-- ============================================================================
-- 10. OFFER ACCEPTED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">🎉 Offer Accepted!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Great news! The job offer has been accepted.</p>
    <div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Start Date:</strong></td><td style="color:#374151;font-weight:600;">{{start_date}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Please proceed with the onboarding process for the new team member.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{offer_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Details</a>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">🎉 تم قبول العرض!</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">أخبار رائعة! تم قبول العرض الوظيفي.</p>
    <div style="background-color:#f0fdf4;border-right:4px solid #22c55e;border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">تاريخ البدء:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{start_date}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">يرجى المتابعة مع عملية التأهيل لعضو الفريق الجديد.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{offer_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض التفاصيل</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'offer_accepted');

-- ============================================================================
-- 11. OFFER REJECTED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Offer Declined</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Unfortunately, the job offer has been declined by the candidate.</p>
    <div style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Reason:</strong></td><td style="color:#374151;">{{rejection_reason}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{offer_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Details</a>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم رفض العرض</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">للأسف، تم رفض العرض الوظيفي من قبل المرشح.</p>
    <div style="background-color:#fef2f2;border-right:4px solid #ef4444;border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">السبب:</strong></td><td style="color:#374151;text-align:left;">{{rejection_reason}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{offer_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض التفاصيل</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'offer_rejected');

-- ============================================================================
-- 12. OFFER EXPIRED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Offer Expired</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A job offer has expired without response from the candidate.</p>
    <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Candidate:</strong></td><td style="color:#374151;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#b45309;">Expired on:</strong></td><td style="color:#374151;">{{expiry_date}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">You may want to follow up with the candidate or consider other applicants.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{offer_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Details</a>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">انتهت صلاحية العرض</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">انتهت صلاحية عرض وظيفي دون استجابة من المرشح.</p>
    <div style="background-color:#fef3c7;border-right:4px solid #f59e0b;border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">المرشح:</strong></td><td style="color:#374151;text-align:left;">{{candidate_name}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#b45309;">انتهى في:</strong></td><td style="color:#374151;text-align:left;">{{expiry_date}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">قد ترغب في المتابعة مع المرشح أو النظر في متقدمين آخرين.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{offer_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض التفاصيل</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'offer_expired');
