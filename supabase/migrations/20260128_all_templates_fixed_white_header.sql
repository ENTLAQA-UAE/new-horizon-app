-- ============================================================================
-- ALL EMAIL TEMPLATES - FIXED WHITE HEADER DESIGN
-- ============================================================================
-- Updates ALL 26 email templates with consistent design:
-- - Header: WHITE background with org logo (NO colored gradient)
-- - Button color: #6b7280 (gray-500)
-- - Label color: #1e40af (blue-800)
-- ============================================================================

-- 1. USER_INVITED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{user_name}}</strong>,</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;"><strong>{{inviter_name}}</strong> has invited you to join <strong>{{org_name}}</strong> as a <strong>{{role}}</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{invitation_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Accept Invitation</a>
</td></tr></table>
<p style="color:#6b7280;font-size:14px;margin:24px 0 0;text-align:center;">This invitation expires in 7 days.</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'user_invited');

-- 2. USER_JOINED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">A new member has joined your organization:</p>
<div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Name:</span></td><td style="color:#374151;padding:8px 0;">{{user_name}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Email:</span></td><td style="color:#374151;padding:8px 0;">{{user_email}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Role:</span></td><td style="color:#374151;padding:8px 0;">{{role}}</td></tr>
</table></div>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'user_joined');

-- 3. PASSWORD_RESET
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{user_name}}</strong>,</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">We received a request to reset your password. Click the button below to create a new password:</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{reset_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Reset Password</a>
</td></tr></table>
<p style="color:#6b7280;font-size:14px;margin:24px 0 0;text-align:center;">This link expires in {{expiry_time}}.</p>
<div style="background:#fef3c7;border-radius:8px;padding:16px;margin-top:24px;">
<p style="color:#92400e;font-size:13px;margin:0;">If you didn''t request this, please ignore this email.</p></div>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'password_reset');

-- 4. ROLE_CHANGED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{user_name}}</strong>,</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Your role at <strong>{{org_name}}</strong> has been updated.</p>
<div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Previous Role:</span></td><td style="color:#374151;padding:8px 0;">{{previous_role}}</td></tr>
<tr><td style="padding:8px 0;"><strong style="color:#111827;">New Role:</strong></td><td style="color:#374151;padding:8px 0;font-weight:600;">{{role}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Changed by:</span></td><td style="color:#374151;padding:8px 0;">{{changed_by}}</td></tr>
</table></div>
<p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Your access permissions have been updated accordingly.</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:24px 0 0;">Best regards,<br><strong>{{org_name}} Team</strong></p>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'role_changed');

-- 5. NEW_APPLICATION
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">A new application has been received for <strong>{{job_title}}</strong>.</p>
<div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Candidate:</span></td><td style="color:#374151;padding:8px 0;">{{candidate_name}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Email:</span></td><td style="color:#374151;padding:8px 0;">{{candidate_email}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Review Application</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'new_application');

-- 6. APPLICATION_RECEIVED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{candidate_name}}</strong>,</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Thank you for applying for the <strong>{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">We have received your application and our team will review it shortly.</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:24px 0 0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'application_received');

-- 7. CANDIDATE_STAGE_MOVED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">A candidate has been moved to a new stage:</p>
<div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Candidate:</span></td><td style="color:#374151;padding:8px 0;">{{candidate_name}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">New Stage:</span></td><td style="color:#374151;padding:8px 0;font-weight:600;">{{stage_name}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">View Application</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'candidate_stage_moved');

-- 8. CANDIDATE_DISQUALIFIED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">A candidate has been disqualified:</p>
<div style="background:#fef2f2;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Candidate:</span></td><td style="color:#374151;padding:8px 0;">{{candidate_name}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Reason:</span></td><td style="color:#374151;padding:8px 0;">{{reason}}</td></tr>
</table></div>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'candidate_disqualified');

-- 9. CANDIDATE_REJECTION
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Dear <strong>{{candidate_name}}</strong>,</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Thank you for your interest in the <strong>{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">After careful consideration, we have decided to move forward with other candidates.</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">We encourage you to apply for future openings. We wish you the best in your career journey.</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">Best regards,<br><strong>{{org_name}} Recruitment Team</strong></p>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'candidate_rejection');

-- 10. INTERVIEW_SCHEDULED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{candidate_name}}</strong>,</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Great news! You have been invited to an interview for the <strong>{{job_title}}</strong> position.</p>
<div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Date:</span></td><td style="color:#374151;padding:8px 0;">{{interview_date}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Time:</span></td><td style="color:#374151;padding:8px 0;">{{interview_time}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Type:</span></td><td style="color:#374151;padding:8px 0;">{{interview_type}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Interviewer:</span></td><td style="color:#374151;padding:8px 0;">{{interviewer_name}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 24px;">
<a href="{{meeting_link}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Join Meeting</a>
</td></tr></table>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">We look forward to speaking with you!</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'interview_scheduled');

-- 11. INTERVIEW_REMINDER
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{candidate_name}}</strong>,</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">This is a reminder about your upcoming interview for <strong>{{job_title}}</strong>.</p>
<div style="background:#fef3c7;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#92400e;font-weight:600;">Date:</span></td><td style="color:#374151;padding:8px 0;">{{interview_date}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#92400e;font-weight:600;">Time:</span></td><td style="color:#374151;padding:8px 0;">{{interview_time}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 24px;">
<a href="{{meeting_link}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Join Meeting</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'interview_reminder');

-- 12. INTERVIEW_CANCELLED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{candidate_name}}</strong>,</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">We regret to inform you that your interview for <strong>{{job_title}}</strong> has been cancelled.</p>
<div style="background:#fef2f2;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#dc2626;font-weight:600;">Original Date:</span></td><td style="color:#374151;padding:8px 0;">{{interview_date}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#dc2626;font-weight:600;">Original Time:</span></td><td style="color:#374151;padding:8px 0;">{{interview_time}}</td></tr>
</table></div>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">We will be in touch to reschedule. We apologize for any inconvenience.</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'interview_cancelled');

-- 13. INTERVIEW_RESCHEDULED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{candidate_name}}</strong>,</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Your interview for <strong>{{job_title}}</strong> has been rescheduled.</p>
<div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">New Date:</span></td><td style="color:#374151;padding:8px 0;font-weight:600;">{{interview_date}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">New Time:</span></td><td style="color:#374151;padding:8px 0;font-weight:600;">{{interview_time}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Type:</span></td><td style="color:#374151;padding:8px 0;">{{interview_type}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 24px;">
<a href="{{meeting_link}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Join Meeting</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'interview_rescheduled');

-- 14. SCORECARD_SUBMITTED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">A scorecard has been submitted:</p>
<div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Candidate:</span></td><td style="color:#374151;padding:8px 0;">{{candidate_name}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Submitted by:</span></td><td style="color:#374151;padding:8px 0;">{{interviewer_name}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Score:</span></td><td style="color:#374151;padding:8px 0;font-weight:600;">{{score}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">View Scorecard</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'scorecard_submitted');

-- 15. SCORECARD_REMINDER
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{receiver_name}}</strong>,</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Please remember to submit your scorecard for <strong>{{candidate_name}}</strong>''s interview for the <strong>{{job_title}}</strong> position.</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Submit Scorecard</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'scorecard_reminder');

-- 16. OFFER_CREATED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">A new offer has been created and is pending approval:</p>
<div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Candidate:</span></td><td style="color:#374151;padding:8px 0;">{{candidate_name}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Salary:</span></td><td style="color:#374151;padding:8px 0;">{{salary}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Review Offer</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'offer_created');

-- 17. OFFER_SENT
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hi <strong>{{candidate_name}}</strong>,</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Congratulations! We are pleased to extend an offer for the <strong>{{job_title}}</strong> position at <strong>{{org_name}}</strong>.</p>
<div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Salary:</span></td><td style="color:#374151;padding:8px 0;">{{salary}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Start Date:</span></td><td style="color:#374151;padding:8px 0;">{{start_date}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 24px;">
<a href="{{offer_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">View Full Offer</a>
</td></tr></table>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0;">Please review the offer details and let us know your decision.</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'offer_sent');

-- 18. OFFER_ACCEPTED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Great news! The offer has been accepted:</p>
<div style="background:#dcfce7;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#166534;font-weight:600;">Candidate:</span></td><td style="color:#374151;padding:8px 0;">{{candidate_name}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#166534;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#166534;font-weight:600;">Start Date:</span></td><td style="color:#374151;padding:8px 0;">{{start_date}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">View Details</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'offer_accepted');

-- 19. OFFER_REJECTED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">The offer has been declined:</p>
<div style="background:#fef2f2;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#dc2626;font-weight:600;">Candidate:</span></td><td style="color:#374151;padding:8px 0;">{{candidate_name}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#dc2626;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#dc2626;font-weight:600;">Reason:</span></td><td style="color:#374151;padding:8px 0;">{{reason}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">View Details</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'offer_rejected');

-- 20. OFFER_EXPIRED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">An offer has expired:</p>
<div style="background:#fef3c7;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#92400e;font-weight:600;">Candidate:</span></td><td style="color:#374151;padding:8px 0;">{{candidate_name}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#92400e;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#92400e;font-weight:600;">Expired on:</span></td><td style="color:#374151;padding:8px 0;">{{expiry_date}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">View Details</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'offer_expired');

-- 21. JOB_PUBLISHED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">A new job has been published:</p>
<div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;font-weight:600;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Department:</span></td><td style="color:#374151;padding:8px 0;">{{department}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Location:</span></td><td style="color:#374151;padding:8px 0;">{{location}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">View Job</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'job_published');

-- 22. JOB_CLOSED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">A job posting has been closed:</p>
<div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Status:</span></td><td style="color:#374151;padding:8px 0;">Closed</td></tr>
</table></div>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'job_closed');

-- 23. JOB_EXPIRING
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">A job posting is about to expire:</p>
<div style="background:#fef3c7;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#92400e;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#92400e;font-weight:600;">Expires on:</span></td><td style="color:#374151;padding:8px 0;">{{expiry_date}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Manage Job</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'job_expiring');

-- 24. REQUISITION_CREATED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">A new requisition has been created:</p>
<div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#1e40af;font-weight:600;">Department:</span></td><td style="color:#374151;padding:8px 0;">{{department}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Review Requisition</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'requisition_created');

-- 25. REQUISITION_APPROVED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Your requisition has been approved:</p>
<div style="background:#dcfce7;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#166534;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#166534;font-weight:600;">Status:</span></td><td style="color:#166534;padding:8px 0;font-weight:600;">Approved</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Create Job Posting</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'requisition_approved');

-- 26. REQUISITION_REJECTED
UPDATE default_email_templates SET body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:#ffffff;padding:40px;text-align:center;border-bottom:1px solid #e5e7eb;">
<img src="{{org_logo}}" alt="{{org_name}}" style="max-height:60px;max-width:200px;" onerror="this.style.display=''none''"></td></tr>
<tr><td style="padding:40px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Your requisition has been rejected:</p>
<div style="background:#fef2f2;border-radius:12px;padding:24px;margin:0 0 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#dc2626;font-weight:600;">Position:</span></td><td style="color:#374151;padding:8px 0;">{{job_title}}</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#dc2626;font-weight:600;">Status:</span></td><td style="color:#dc2626;padding:8px 0;font-weight:600;">Rejected</td></tr>
<tr><td style="padding:8px 0;"><span style="color:#dc2626;font-weight:600;">Reason:</span></td><td style="color:#374151;padding:8px 0;">{{reason}}</td></tr>
</table></div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="{{action_url}}" style="display:inline-block;background:#6b7280;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">View Details</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="color:#6b7280;font-size:13px;margin:0;">© {{org_name}}</p></td></tr>
</table></td></tr></table></body></html>'
WHERE event_id = (SELECT id FROM notification_events WHERE code = 'requisition_rejected');
