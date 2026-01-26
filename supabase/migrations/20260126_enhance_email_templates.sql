-- ============================================================================
-- ENHANCE EMAIL TEMPLATES
-- Updates templates based on user feedback:
-- 1. Application Received: Remove links (candidates track via portal separately)
-- 2. Password Reset: Add security tips
-- 3. Role Changed: Better content
-- 4. User Joined: More welcoming content
-- ============================================================================

-- 1. APPLICATION RECEIVED - Remove tracking link (per user feedback)
UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
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
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Thank you for your interest in joining <strong>{{org_name}}</strong>! We have received your application for the <strong style="color:#059669;">{{job_title}}</strong> position.</p>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:24px;margin:0 0 24px;">
      <p style="margin:0 0 12px;color:#166534;font-weight:600;font-size:16px;">What happens next?</p>
      <ul style="margin:0;padding:0 0 0 20px;color:#6b7280;font-size:14px;line-height:1.8;">
        <li>Our recruitment team will carefully review your application</li>
        <li>We typically respond within 5-7 business days</li>
        <li>If your qualifications match our needs, we will contact you for the next steps</li>
      </ul>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">Please ensure you have provided accurate contact information so we can reach you.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
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
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم استلام طلبك!</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">عزيزي/عزيزتي <strong>{{candidate_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">شكراً لاهتمامك بالانضمام إلى <strong>{{org_name}}</strong>! لقد استلمنا طلبك لوظيفة <strong style="color:#059669;">{{job_title}}</strong>.</p>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:24px;margin:0 0 24px;">
      <p style="margin:0 0 12px;color:#166534;font-weight:600;font-size:16px;">ماذا يحدث بعد ذلك؟</p>
      <ul style="margin:0;padding:0 20px 0 0;color:#6b7280;font-size:14px;line-height:2;list-style-position:inside;">
        <li>سيقوم فريق التوظيف لدينا بمراجعة طلبك بعناية</li>
        <li>نرد عادةً خلال 5-7 أيام عمل</li>
        <li>إذا تطابقت مؤهلاتك مع احتياجاتنا، سنتواصل معك للخطوات التالية</li>
      </ul>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 20px;">يرجى التأكد من تقديم معلومات اتصال دقيقة حتى نتمكن من التواصل معك.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0;">مع أطيب التحيات،<br><strong>فريق التوظيف في {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'application_received');

-- 2. PASSWORD RESET - Enhanced with more security tips
UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Password Reset Request</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{{user_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">We received a request to reset your password for your <strong>{{org_name}}</strong> account.</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Click the button below to create a new password:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{reset_url}}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Reset My Password</a>
    </td></tr></table>
    <p style="color:#ef4444;font-size:14px;margin:24px 0;text-align:center;font-weight:500;">⏰ This link expires in 1 hour for your security.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:20px;margin-top:24px;">
      <p style="color:#92400e;font-size:14px;margin:0 0 12px;font-weight:600;">🔒 Security Tips:</p>
      <ul style="margin:0;padding:0 0 0 20px;color:#92400e;font-size:13px;line-height:1.8;">
        <li>If you didn''t request this reset, please ignore this email</li>
        <li>Never share your password or this link with anyone</li>
        <li>Use a strong, unique password with at least 8 characters</li>
        <li>Consider using a mix of letters, numbers, and symbols</li>
      </ul>
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
  <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">طلب إعادة تعيين كلمة المرور</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{user_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في <strong>{{org_name}}</strong>.</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">انقر على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{reset_url}}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">إعادة تعيين كلمة المرور</a>
    </td></tr></table>
    <p style="color:#ef4444;font-size:14px;margin:24px 0;text-align:center;font-weight:500;">⏰ تنتهي صلاحية هذا الرابط خلال ساعة واحدة لأمانك.</p>
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:20px;margin-top:24px;">
      <p style="color:#92400e;font-size:14px;margin:0 0 12px;font-weight:600;text-align:right;">🔒 نصائح أمنية:</p>
      <ul style="margin:0;padding:0 20px 0 0;color:#92400e;font-size:13px;line-height:2;list-style-position:inside;">
        <li>إذا لم تطلب إعادة التعيين، يرجى تجاهل هذا البريد</li>
        <li>لا تشارك كلمة المرور أو هذا الرابط مع أي شخص</li>
        <li>استخدم كلمة مرور قوية وفريدة مكونة من 8 أحرف على الأقل</li>
        <li>فكر في استخدام مزيج من الحروف والأرقام والرموز</li>
      </ul>
    </div>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'password_reset');

-- 3. USER JOINED - More welcoming with helpful next steps
UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Welcome to the Team! 🎉</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{{user_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Congratulations! Your account has been successfully created and you are now part of <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:24px;margin:0 0 24px;">
      <p style="margin:0 0 12px;color:#166534;font-weight:600;font-size:16px;">Getting Started:</p>
      <ul style="margin:0;padding:0 0 0 20px;color:#6b7280;font-size:14px;line-height:1.8;">
        <li>Log in to your dashboard to explore the platform</li>
        <li>Complete your profile with your information</li>
        <li>Check your assigned tasks and permissions</li>
        <li>Reach out to your team if you have any questions</li>
      </ul>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{action_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Go to Dashboard</a>
    </td></tr></table>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:24px 0 0;">Welcome aboard!<br><strong>{{org_name}} Team</strong></p>
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
  <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">مرحباً بك في الفريق! 🎉</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{user_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">تهانينا! تم إنشاء حسابك بنجاح وأنت الآن جزء من <strong>{{org_name}}</strong>.</p>
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:24px;margin:0 0 24px;">
      <p style="margin:0 0 12px;color:#166534;font-weight:600;font-size:16px;text-align:right;">للبدء:</p>
      <ul style="margin:0;padding:0 20px 0 0;color:#6b7280;font-size:14px;line-height:2;list-style-position:inside;">
        <li>سجل الدخول إلى لوحة التحكم لاستكشاف المنصة</li>
        <li>أكمل ملفك الشخصي بمعلوماتك</li>
        <li>تحقق من المهام والصلاحيات المخصصة لك</li>
        <li>تواصل مع فريقك إذا كان لديك أي أسئلة</li>
      </ul>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="{{action_url}}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">انتقل إلى لوحة التحكم</a>
    </td></tr></table>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:24px 0 0;">أهلاً بك معنا!<br><strong>فريق {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'user_joined');

-- 4. ROLE CHANGED - Better formatted with role descriptions
UPDATE default_email_templates
SET body_html = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:''Segoe UI'',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Your Role Has Been Updated</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{{user_name}}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Your role at <strong>{{org_name}}</strong> has been updated by <strong>{{changed_by}}</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td width="45%" style="background-color:#fee2e2;padding:20px;border-radius:8px;text-align:center;vertical-align:top;">
          <p style="margin:0;color:#991b1b;font-size:12px;text-transform:uppercase;font-weight:500;">Previous Role</p>
          <p style="margin:12px 0 0;color:#dc2626;font-weight:700;font-size:18px;">{{old_role}}</p>
        </td>
        <td width="10%" style="text-align:center;vertical-align:middle;color:#9ca3af;font-size:28px;">→</td>
        <td width="45%" style="background-color:#dcfce7;padding:20px;border-radius:8px;text-align:center;vertical-align:top;">
          <p style="margin:0;color:#166534;font-size:12px;text-transform:uppercase;font-weight:500;">New Role</p>
          <p style="margin:12px 0 0;color:#16a34a;font-weight:700;font-size:18px;">{{new_role}}</p>
        </td>
      </tr>
    </table>
    <div style="background-color:#f3f4f6;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Your permissions and access have been updated accordingly. If you have any questions about your new role or need assistance, please contact your administrator.</p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">Best regards,<br><strong>{{org_name}} Team</strong></p>
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
  <tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:40px;text-align:center;">
    <img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;margin-bottom:20px;" onerror="this.style.display=''none''">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">تم تحديث دورك</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{{user_name}}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">تم تحديث دورك في <strong>{{org_name}}</strong> بواسطة <strong>{{changed_by}}</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td width="45%" style="background-color:#dcfce7;padding:20px;border-radius:8px;text-align:center;vertical-align:top;">
          <p style="margin:0;color:#166534;font-size:12px;font-weight:500;">الدور الجديد</p>
          <p style="margin:12px 0 0;color:#16a34a;font-weight:700;font-size:18px;">{{new_role}}</p>
        </td>
        <td width="10%" style="text-align:center;vertical-align:middle;color:#9ca3af;font-size:28px;">←</td>
        <td width="45%" style="background-color:#fee2e2;padding:20px;border-radius:8px;text-align:center;vertical-align:top;">
          <p style="margin:0;color:#991b1b;font-size:12px;font-weight:500;">الدور السابق</p>
          <p style="margin:12px 0 0;color:#dc2626;font-weight:700;font-size:18px;">{{old_role}}</p>
        </td>
      </tr>
    </table>
    <div style="background-color:#f3f4f6;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.8;text-align:right;">تم تحديث صلاحياتك ووصولك وفقاً لذلك. إذا كان لديك أي أسئلة حول دورك الجديد أو تحتاج إلى مساعدة، يرجى التواصل مع المسؤول.</p>
    </div>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0;">مع أطيب التحيات،<br><strong>فريق {{org_name}}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}} • مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'role_changed');
