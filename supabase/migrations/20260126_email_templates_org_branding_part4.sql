-- ============================================================================
-- EMAIL TEMPLATES WITH ORGANIZATION BRANDING - PART 4
-- ============================================================================
-- Final templates: jobs and requisitions
-- ============================================================================

-- ============================================================================
-- 13. JOB PUBLISHED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Job Published! 🚀</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new job has been published and is now live.</p>
    <div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;font-weight:600;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Location:</strong></td><td style="color:#374151;">{{location}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#6b7280;">Published by:</strong></td><td style="color:#374151;">{{published_by}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Job Posting</a>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم نشر الوظيفة! 🚀</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم نشر وظيفة جديدة وهي متاحة الآن.</p>
    <div style="background-color:#f0fdf4;border-right:4px solid #22c55e;border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الموقع:</strong></td><td style="color:#374151;text-align:left;">{{location}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#6b7280;">تم النشر بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{published_by}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض إعلان الوظيفة</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'job_published');

-- ============================================================================
-- 14. JOB CLOSED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Job Closed</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A job posting has been closed.</p>
    <div style="background-color:#f8f9fa;border-left:4px solid {{primary_color}};border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Total Applications:</strong></td><td style="color:#374151;font-weight:600;">{{total_applications}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#6b7280;">Closed by:</strong></td><td style="color:#374151;">{{closed_by}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#6b7280;">Reason:</strong></td><td style="color:#374151;">{{close_reason}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Job Details</a>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم إغلاق الوظيفة</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم إغلاق إعلان وظيفي.</p>
    <div style="background-color:#f8f9fa;border-right:4px solid {{primary_color}};border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">إجمالي الطلبات:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{total_applications}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#6b7280;">تم الإغلاق بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{closed_by}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#6b7280;">السبب:</strong></td><td style="color:#374151;text-align:left;">{{close_reason}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض تفاصيل الوظيفة</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'job_closed');

-- ============================================================================
-- 15. JOB EXPIRING - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">⚠️ Job Expiring Soon</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A job posting is about to expire and needs attention.</p>
    <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#b45309;">Expires on:</strong></td><td style="color:#374151;font-weight:600;">{{expiry_date}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Applications:</strong></td><td style="color:#374151;">{{total_applications}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Consider extending the posting or closing it if the position has been filled.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Manage Job</a>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">⚠️ الوظيفة على وشك الانتهاء</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">إعلان وظيفي على وشك الانتهاء ويحتاج للمراجعة.</p>
    <div style="background-color:#fef3c7;border-right:4px solid #f59e0b;border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#b45309;">ينتهي في:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{expiry_date}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الطلبات:</strong></td><td style="color:#374151;text-align:left;">{{total_applications}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">فكر في تمديد الإعلان أو إغلاقه إذا تم شغل الوظيفة.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{job_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">إدارة الوظيفة</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'job_expiring');

-- ============================================================================
-- 16. REQUISITION CREATED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">New Requisition</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A new job requisition has been submitted for approval.</p>
    <div style="background-color:#f8f9fa;border-left:4px solid {{primary_color}};border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;font-weight:600;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Headcount:</strong></td><td style="color:#374151;">{{headcount}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#6b7280;">Requested by:</strong></td><td style="color:#374151;">{{requested_by}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#6b7280;">Priority:</strong></td><td style="color:#374151;">{{priority}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{requisition_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Review Requisition</a>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">طلب توظيف جديد</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تم تقديم طلب توظيف جديد للموافقة.</p>
    <div style="background-color:#f8f9fa;border-right:4px solid {{primary_color}};border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">عدد الموظفين:</strong></td><td style="color:#374151;text-align:left;">{{headcount}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#6b7280;">مقدم الطلب:</strong></td><td style="color:#374151;text-align:left;">{{requested_by}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#6b7280;">الأولوية:</strong></td><td style="color:#374151;text-align:left;">{{priority}}</td></tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{requisition_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">مراجعة الطلب</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'requisition_created');

-- ============================================================================
-- 17. REQUISITION APPROVED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">✓ Requisition Approved</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Great news! Your job requisition has been approved.</p>
    <div style="background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;font-weight:600;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#166534;">Approved by:</strong></td><td style="color:#374151;">{{approved_by}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">You can now proceed to create and publish the job posting.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{requisition_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Create Job Posting</a>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">✓ تمت الموافقة على الطلب</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">أخبار رائعة! تمت الموافقة على طلب التوظيف الخاص بك.</p>
    <div style="background-color:#f0fdf4;border-right:4px solid #22c55e;border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;font-weight:600;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#166534;">تمت الموافقة بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{approved_by}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">يمكنك الآن المتابعة لإنشاء ونشر إعلان الوظيفة.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{requisition_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">إنشاء إعلان الوظيفة</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'requisition_approved');

-- ============================================================================
-- 18. REQUISITION REJECTED - Use org branding
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Requisition Not Approved</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Your job requisition was not approved at this time.</p>
    <div style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Position:</strong></td><td style="color:#374151;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:{{primary_color}};">Department:</strong></td><td style="color:#374151;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Rejected by:</strong></td><td style="color:#374151;">{{rejected_by}}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#991b1b;">Reason:</strong></td><td style="color:#374151;">{{rejection_reason}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Please review the feedback and consider resubmitting with the necessary adjustments.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{requisition_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Details</a>
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
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">لم تتم الموافقة على الطلب</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">لم تتم الموافقة على طلب التوظيف الخاص بك في الوقت الحالي.</p>
    <div style="background-color:#fef2f2;border-right:4px solid #ef4444;border-radius:8px 0 0 8px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">الوظيفة:</strong></td><td style="color:#374151;text-align:left;">{{job_title}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:{{primary_color}};">القسم:</strong></td><td style="color:#374151;text-align:left;">{{department}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">تم الرفض بواسطة:</strong></td><td style="color:#374151;text-align:left;">{{rejected_by}}</td></tr>
        <tr><td style="padding:8px 0;text-align:right;"><strong style="color:#991b1b;">السبب:</strong></td><td style="color:#374151;text-align:left;">{{rejection_reason}}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">يرجى مراجعة الملاحظات والنظر في إعادة التقديم مع التعديلات اللازمة.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="{{requisition_url}}" style="display:inline-block;background-color:{{primary_color}};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">عرض التفاصيل</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'requisition_rejected');

-- Add comment to track all updates
COMMENT ON TABLE default_email_templates IS 'All 26 email templates now use {{primary_color}} for org branding - completed 2026-01-26';
