# Jadarat ATS - Complete Task List for Production Launch
## Based on BRD Gap Analysis (10 Sections)

**Total Tasks:** 247
**Estimated Duration:** 24 weeks (12 sprints x 2 weeks)
**Status Legend:** ⬜ Not Started | 🟡 In Progress | ✅ Completed

---

# ⚠️ CRITICAL BLOCKER: AUTHENTICATION (Must Fix First)

**Status:** 🔴 BLOCKING ALL PROGRESS - Users cannot log in to the application

## Problem Summary
Login succeeds but users are redirected back to login in an infinite loop. The session is not persisting correctly between the login page and the dashboard.

## Console Evidence (from jadarat-ats.vercel.app)
```
RootRedirect: Session found ✓ → redirects to /admin
AuthProvider: getSession timed out ⚠️ → No session found → redirects to /login
```

## Tasks to Fix Authentication
- ✅ AUTH.1 Add debug logging to diagnose issue (commit 1c98b9b)
- ✅ AUTH.2 Replace Supabase client with raw fetch for queries (commit b2c383d)
- ✅ AUTH.3 Fix getSession timeout causing infinite loading (commit b9c148a)
- ✅ AUTH.4 Fix session persistence race condition (commit c0ab493)
- ✅ AUTH.5 Fix organization-specific role redirect (commit fed419e)
- ⬜ AUTH.6 Fix race condition: RootRedirect clears session before AuthProvider reads it
- ⬜ AUTH.7 Ensure Supabase stores session in localStorage correctly
- ⬜ AUTH.8 Consider using cookies/middleware for session instead of localStorage
- ⬜ AUTH.9 Test login flow end-to-end on production

## Key Files
- `src/lib/auth/auth-context.tsx` - AuthProvider
- `src/app/page.tsx` - RootRedirect
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/(admin)/layout.tsx` - AdminLayout auth check

---

# SECTION 1: USER ROLES & PERMISSIONS (38 Tasks) ✅ COMPLETED

## 1.1 Database Schema for RBAC
- ✅ 1.1.1 Create `roles` table with org_id, name, name_ar, is_system_role
- ✅ 1.1.2 Create `permissions` table with code, name, name_ar, category
- ✅ 1.1.3 Create `role_permissions` junction table
- ✅ 1.1.4 Create `user_roles` junction table with org_id scope
- ✅ 1.1.5 Add RLS policies for all RBAC tables
- ✅ 1.1.6 Create indexes for performance

## 1.2 System Roles Setup
- ✅ 1.2.1 Define Super Admin role and permissions
- ✅ 1.2.2 Define Organization Admin role and permissions
- ✅ 1.2.3 Define HR Manager role and permissions
- ✅ 1.2.4 Define Recruiter role and permissions
- ✅ 1.2.5 Define Hiring Manager role and permissions
- ✅ 1.2.6 Define Candidate role and permissions
- ✅ 1.2.7 Create seed script for default roles
- ✅ 1.2.8 Create seed script for all permissions

## 1.3 Permission Categories Implementation
- ✅ 1.3.1 Implement JOBS permissions (create, read, update, delete, publish, close, approve)
- ✅ 1.3.2 Implement CANDIDATES permissions (create, read, update, delete, export, bulk)
- ✅ 1.3.3 Implement APPLICATIONS permissions (read, update, move_stage, reject, shortlist)
- ✅ 1.3.4 Implement INTERVIEWS permissions (create, read, update, cancel, scorecard, feedback)
- ✅ 1.3.5 Implement OFFERS permissions (create, read, update, approve, send, rescind)
- ✅ 1.3.6 Implement ORGANIZATION permissions (settings, branding, users, roles, departments)
- ✅ 1.3.7 Implement ANALYTICS permissions (dashboard, reports, compliance)
- ✅ 1.3.8 Implement COMPLIANCE permissions (view, configure, export)

## 1.4 Permission Checking System
- ✅ 1.4.1 Create `usePermission` React hook
- ✅ 1.4.2 Create `withPermission` HOC for components
- ✅ 1.4.3 Create `checkPermission` server-side utility
- ✅ 1.4.4 Create permission middleware for API routes
- ✅ 1.4.5 Implement permission caching for performance

## 1.5 Role-Based UI Components
- ✅ 1.5.1 Create role-aware Sidebar component
- ✅ 1.5.2 Create role-aware Header component
- ✅ 1.5.3 Create PermissionGate component for conditional rendering
- ✅ 1.5.4 Update navigation to show/hide based on role

## 1.6 Role-Specific Dashboards
- ✅ 1.6.1 Create Super Admin Dashboard (platform stats, all orgs, billing)
- ✅ 1.6.2 Create Organization Admin Dashboard (org overview, users, compliance)
- ✅ 1.6.3 Create HR Manager Dashboard (hiring metrics, workflows, compliance)
- ✅ 1.6.4 Create Recruiter Dashboard (my jobs, candidates, interviews, tasks)
- ✅ 1.6.5 Create Hiring Manager Dashboard (pending reviews, approvals)
- ✅ 1.6.6 Implement dashboard routing based on user role

## 1.7 Role Management UI
- ✅ 1.7.1 Create Role listing page
- ✅ 1.7.2 Create Role create/edit form
- ✅ 1.7.3 Create Permission assignment matrix UI
- ✅ 1.7.4 Create User role assignment UI
- ✅ 1.7.5 Create Role audit log view

---

# SECTION 2: EXTERNAL INTEGRATIONS (42 Tasks) ✅ COMPLETED

## 2.1 Zoom Integration
- ✅ 2.1.1 Register Zoom OAuth App and get credentials
- ✅ 2.1.2 Create Zoom OAuth flow (/api/zoom/connect)
- ✅ 2.1.3 Create Zoom OAuth callback handler (/api/zoom/callback)
- ✅ 2.1.4 Store Zoom tokens in user_integrations table
- ✅ 2.1.5 Implement Zoom token refresh logic
- ✅ 2.1.6 Create Zoom meeting creation API
- ✅ 2.1.7 Create Zoom meeting update API
- ✅ 2.1.8 Create Zoom meeting delete API
- ✅ 2.1.9 Add zoom_meeting_id, zoom_join_url to interviews table
- ✅ 2.1.10 Create Zoom webhook handler for meeting events
- ✅ 2.1.11 Add Zoom connection UI in settings

## 2.2 Microsoft Teams Integration
- ✅ 2.2.1 Register Microsoft Azure AD App
- ✅ 2.2.2 Create Microsoft OAuth flow (/api/microsoft/connect)
- ✅ 2.2.3 Create Microsoft OAuth callback handler
- ✅ 2.2.4 Store Microsoft tokens in user_integrations table
- ✅ 2.2.5 Implement Microsoft token refresh logic
- ✅ 2.2.6 Create Teams online meeting creation API (Graph API)
- ✅ 2.2.7 Create Teams meeting update API
- ✅ 2.2.8 Create Teams meeting delete API
- ✅ 2.2.9 Add teams_meeting_id, teams_join_url to interviews table
- ✅ 2.2.10 Add Teams connection UI in settings

## 2.3 Outlook Calendar Integration
- ✅ 2.3.1 Use existing Microsoft OAuth for Calendar scope
- ✅ 2.3.2 Create Outlook calendar event creation API
- ✅ 2.3.3 Create Outlook calendar event update API
- ✅ 2.3.4 Create Outlook calendar event delete API
- ✅ 2.3.5 Create Outlook free/busy query API
- ✅ 2.3.6 Add Outlook Calendar sync option in interviews
- ✅ 2.3.7 Add calendar_provider field to interviews table

## 2.4 Video Platform Selector
- ✅ 2.4.1 Create video platform selector component
- ✅ 2.4.2 Add video_platform field to interview form
- ✅ 2.4.3 Auto-generate meeting link based on selected platform
- ✅ 2.4.4 Display correct platform icon in interview cards
- ✅ 2.4.5 Create one-click join button with correct URL

## 2.5 Integration Settings Page
- ✅ 2.5.1 Create /org/settings/integrations page
- ✅ 2.5.2 Show Google Calendar connection status
- ✅ 2.5.3 Show Outlook Calendar connection status
- ✅ 2.5.4 Show Zoom connection status
- ✅ 2.5.5 Show Teams connection status
- ✅ 2.5.6 Add connect/disconnect buttons for each
- ✅ 2.5.7 Show last sync time for each integration

## 2.6 Error Tracking (Sentry)
- ✅ 2.6.1 Install and configure Sentry SDK
- ✅ 2.6.2 Set up Sentry project and DSN
- ✅ 2.6.3 Add error boundary components
- ✅ 2.6.4 Configure source maps upload
- ✅ 2.6.5 Add user context to error reports

---

# SECTION 3: PER-ORGANIZATION EMAIL CONFIGURATION (35 Tasks) ✅ COMPLETED

## 3.1 Database Schema
- ✅ 3.1.1 Create `organization_email_settings` table
- ✅ 3.1.2 Add email_provider field (resend, smtp, sendgrid, mailgun)
- ✅ 3.1.3 Add SMTP configuration fields (host, port, username, password, encryption)
- ✅ 3.1.4 Add Resend API key field (encrypted)
- ✅ 3.1.5 Add from_email, from_name, reply_to fields
- ✅ 3.1.6 Add IMAP configuration fields
- ✅ 3.1.7 Add domain verification fields (dkim, spf, verified)
- ✅ 3.1.8 Add email tracking fields (track_opens, track_clicks)
- ✅ 3.1.9 Create `organization_email_logs` table
- ✅ 3.1.10 Add RLS policies for email tables

## 3.2 Email Provider Abstraction
- ✅ 3.2.1 Create EmailProvider interface
- ✅ 3.2.2 Implement ResendProvider class
- ✅ 3.2.3 Implement SMTPProvider class (using nodemailer)
- ✅ 3.2.4 Implement SendGridProvider class
- ✅ 3.2.5 Implement MailgunProvider class
- ✅ 3.2.6 Create getEmailProvider(orgId) factory function
- ✅ 3.2.7 Add encryption/decryption for API keys and passwords

## 3.3 IMAP Integration
- ✅ 3.3.1 Install IMAP library (imap-simple or similar)
- ✅ 3.3.2 Create IMAP connection service
- ✅ 3.3.3 Create email sync job (fetch new emails)
- ✅ 3.3.4 Create email-to-candidate matching logic
- ✅ 3.3.5 Store synced emails in database
- ✅ 3.3.6 Display email thread in candidate view

## 3.4 Email Tracking
- ✅ 3.4.1 Create tracking pixel endpoint (/api/email/track/open)
- ✅ 3.4.2 Create click tracking endpoint (/api/email/track/click)
- ✅ 3.4.3 Record open events in email_logs
- ✅ 3.4.4 Record click events in email_logs
- ✅ 3.4.5 Handle bounce webhooks from providers
- ✅ 3.4.6 Create email analytics dashboard

## 3.5 Domain Verification
- ✅ 3.5.1 Create domain verification wizard UI
- ✅ 3.5.2 Display required DNS records (DKIM, SPF, DMARC)
- ✅ 3.5.3 Create DNS verification check API
- ✅ 3.5.4 Auto-verify domain periodically
- ✅ 3.5.5 Show verification status in settings

## 3.6 Email Settings UI
- ✅ 3.6.1 Create /org/settings/email page
- ✅ 3.6.2 Create email provider selector
- ✅ 3.6.3 Create SMTP configuration form
- ✅ 3.6.4 Create Resend API key form
- ✅ 3.6.5 Create IMAP configuration form
- ✅ 3.6.6 Create test email sending function
- ✅ 3.6.7 Create email logs viewer

---

# SECTION 4: LOCALIZATION - i18n & RTL (32 Tasks)

## 4.1 i18n Framework Setup
- ⬜ 4.1.1 Install next-intl package
- ⬜ 4.1.2 Configure next-intl in next.config.js
- ⬜ 4.1.3 Create i18n routing configuration
- ⬜ 4.1.4 Create locale detection middleware
- ⬜ 4.1.5 Set up messages directory structure

## 4.2 English Translation Files
- ⬜ 4.2.1 Create en/common.json (buttons, labels, general)
- ⬜ 4.2.2 Create en/auth.json (login, signup, password)
- ⬜ 4.2.3 Create en/dashboard.json (stats, widgets)
- ⬜ 4.2.4 Create en/jobs.json (job management)
- ⬜ 4.2.5 Create en/candidates.json (candidate management)
- ⬜ 4.2.6 Create en/applications.json (application pipeline)
- ⬜ 4.2.7 Create en/interviews.json (interview scheduling)
- ⬜ 4.2.8 Create en/offers.json (offer management)
- ⬜ 4.2.9 Create en/settings.json (all settings)
- ⬜ 4.2.10 Create en/errors.json (error messages)

## 4.3 Arabic Translation Files
- ⬜ 4.3.1 Create ar/common.json
- ⬜ 4.3.2 Create ar/auth.json
- ⬜ 4.3.3 Create ar/dashboard.json
- ⬜ 4.3.4 Create ar/jobs.json
- ⬜ 4.3.5 Create ar/candidates.json
- ⬜ 4.3.6 Create ar/applications.json
- ⬜ 4.3.7 Create ar/interviews.json
- ⬜ 4.3.8 Create ar/offers.json
- ⬜ 4.3.9 Create ar/settings.json
- ⬜ 4.3.10 Create ar/errors.json

## 4.4 RTL Layout Support
- ⬜ 4.4.1 Configure Tailwind CSS for RTL (rtl: variant)
- ⬜ 4.4.2 Create RTL-aware layout wrapper
- ⬜ 4.4.3 Update sidebar for RTL
- ⬜ 4.4.4 Update header for RTL
- ⬜ 4.4.5 Fix all directional icons (arrows, chevrons)
- ⬜ 4.4.6 Fix all margin/padding directions
- ⬜ 4.4.7 Test all pages in RTL mode

## 4.5 Language Switcher
- ⬜ 4.5.1 Create LanguageSwitcher component
- ⬜ 4.5.2 Add language switcher to header
- ⬜ 4.5.3 Save language preference to user profile
- ⬜ 4.5.4 Save language preference to cookie
- ⬜ 4.5.5 Apply language on page load

## 4.6 Bilingual Content
- ⬜ 4.6.1 Create bilingual input component (EN/AR tabs)
- ⬜ 4.6.2 Update job form for bilingual input
- ⬜ 4.6.3 Update email template form for bilingual input
- ⬜ 4.6.4 Update pipeline stage form for bilingual input
- ⬜ 4.6.5 Display content in user's preferred language

---

# SECTION 5: COMPLIANCE & MENA-SPECIFIC (28 Tasks)

## 5.1 Saudization (Nitaqat) System
- ⬜ 5.1.1 Create `nationalization_categories` table with Nitaqat rules
- ⬜ 5.1.2 Create `employee_nationalization` table
- ⬜ 5.1.3 Seed Nitaqat categories by sector and company size
- ⬜ 5.1.4 Create Saudization calculation engine
- ⬜ 5.1.5 Calculate current Saudi percentage
- ⬜ 5.1.6 Determine Nitaqat band (Platinum, Green, Yellow, Red)
- ⬜ 5.1.7 Create hiring impact simulator (what-if analysis)
- ⬜ 5.1.8 Create compliance forecasting (trend projection)

## 5.2 Emiratization System
- ⬜ 5.2.1 Seed Emiratization rules by sector
- ⬜ 5.2.2 Create Emiratization calculation engine
- ⬜ 5.2.3 Track skilled vs unskilled categories
- ⬜ 5.2.4 Calculate current Emirati percentage
- ⬜ 5.2.5 Create Nafis integration readiness check

## 5.3 Compliance Dashboard
- ⬜ 5.3.1 Create real-time compliance meter widget
- ⬜ 5.3.2 Create compliance trend chart (monthly/quarterly)
- ⬜ 5.3.3 Create department breakdown view
- ⬜ 5.3.4 Create risk alert system
- ⬜ 5.3.5 Create hiring recommendations engine

## 5.4 Compliance Reporting
- ⬜ 5.4.1 Create `compliance_reports` table
- ⬜ 5.4.2 Create monthly compliance report generator
- ⬜ 5.4.3 Create quarterly trend report generator
- ⬜ 5.4.4 Create audit-ready export (PDF/Excel)
- ⬜ 5.4.5 Create government format export (GOSI, Nafis)
- ⬜ 5.4.6 Create historical comparison view

## 5.5 Job Posting Compliance
- ⬜ 5.5.1 Add requires_saudization flag to job form
- ⬜ 5.5.2 Add requires_emiratization flag to job form
- ⬜ 5.5.3 Filter candidates by nationality for flagged jobs
- ⬜ 5.5.4 Show compliance impact before making hire
- ⬜ 5.5.5 Warn if hire would cause non-compliance

## 5.6 PDPL Compliance
- ⬜ 5.6.1 Create consent management table
- ⬜ 5.6.2 Add PDPL consent checkbox to application form
- ⬜ 5.6.3 Record consent timestamp and IP
- ⬜ 5.6.4 Create data retention policy configuration
- ⬜ 5.6.5 Create right-to-deletion request workflow
- ⬜ 5.6.6 Create data export request workflow

---

# SECTION 6: INTERVIEW & HIRING PROCESS (31 Tasks) 🟡 IN PROGRESS

## 6.1 Interview Scorecards
- ✅ 6.1.1 Create `scorecard_templates` table
- ✅ 6.1.2 Create `interview_scorecards` table
- ✅ 6.1.3 Create default scorecard templates (technical, behavioral, cultural)
- ✅ 6.1.4 Create scorecard template builder UI
- ✅ 6.1.5 Create criteria management (add, edit, reorder, weight)
- ✅ 6.1.6 Create rating scale configuration (1-5, 1-10, custom)
- ✅ 6.1.7 Create scorecard submission form
- ✅ 6.1.8 Add notes per criteria
- ✅ 6.1.9 Add overall recommendation (strong yes/yes/neutral/no/strong no)
- ✅ 6.1.10 Add strengths and weaknesses fields
- ✅ 6.1.11 Lock scorecard after submission

## 6.2 Feedback Aggregation
- ✅ 6.2.1 Create multi-interviewer feedback view
- ✅ 6.2.2 Calculate weighted average scores
- ✅ 6.2.3 Create consensus view (agreement/disagreement)
- ✅ 6.2.4 Create comparison charts
- ✅ 6.2.5 Highlight red flags (low scores, concerns)
- ⬜ 6.2.6 Create candidate comparison tool (side-by-side)

## 6.3 Offer Management
- ✅ 6.3.1 Create `offer_templates` table
- ✅ 6.3.2 Create `offers` table with all fields
- ✅ 6.3.3 Create `offer_approvals` table
- ✅ 6.3.4 Create offer template builder with merge fields
- ✅ 6.3.5 Create offer creation wizard
- ✅ 6.3.6 Create compensation fields (salary, bonus, equity)
- ✅ 6.3.7 Create benefits configuration
- ✅ 6.3.8 Create approval chain configuration
- ✅ 6.3.9 Implement approval workflow
- ⬜ 6.3.10 Create offer PDF generation
- ⬜ 6.3.11 Create offer email sending
- ⬜ 6.3.12 Create e-signature integration
- ⬜ 6.3.13 Create offer acceptance/decline flow
- ⬜ 6.3.14 Create counter-offer handling

---

# SECTION 7: PIPELINE & WORKFLOW (22 Tasks)

## 7.1 Custom Pipelines
- ⬜ 7.1.1 Create pipeline builder UI
- ⬜ 7.1.2 Create stage drag-and-drop reordering
- ⬜ 7.1.3 Create stage configuration (name, color, type)
- ⬜ 7.1.4 Add bilingual stage names (name_ar)
- ⬜ 7.1.5 Create default pipeline templates

## 7.2 Pipeline Per Job
- ⬜ 7.2.1 Add pipeline_id to jobs table
- ⬜ 7.2.2 Create pipeline selector in job form
- ⬜ 7.2.3 Allow creating new pipeline from job form
- ⬜ 7.2.4 Copy pipeline when duplicating job

## 7.3 Stage Approvals
- ⬜ 7.3.1 Add requires_approval field to pipeline_stages
- ⬜ 7.3.2 Add approvers[] field to pipeline_stages
- ⬜ 7.3.3 Create approval request when moving to approval stage
- ⬜ 7.3.4 Create approval UI for approvers
- ⬜ 7.3.5 Send notification on approval request
- ⬜ 7.3.6 Block stage transition until approved

## 7.4 Auto-Email on Stage Change
- ⬜ 7.4.1 Add auto_email_template_id to pipeline_stages
- ⬜ 7.4.2 Create email template selector in stage config
- ⬜ 7.4.3 Trigger email when application moves to stage
- ⬜ 7.4.4 Log sent emails in application history

## 7.5 Screening Questions
- ⬜ 7.5.1 Create `screening_questions` table
- ⬜ 7.5.2 Create `screening_responses` table
- ⬜ 7.5.3 Create question builder UI
- ⬜ 7.5.4 Support question types (text, select, multiselect, boolean, file)
- ⬜ 7.5.5 Create knockout question logic (auto-reject)
- ⬜ 7.5.6 Display screening answers in application view
- ⬜ 7.5.7 Score screening responses

## 7.6 Job Requisition Approval
- ⬜ 7.6.1 Create `job_requisitions` table
- ⬜ 7.6.2 Create `requisition_approvals` table
- ⬜ 7.6.3 Create requisition creation form
- ⬜ 7.6.4 Create approval chain configuration
- ⬜ 7.6.5 Implement approval workflow
- ⬜ 7.6.6 Block job publishing until approved

---

# SECTION 8: CANDIDATE PORTAL (27 Tasks)

## 8.1 Candidate Authentication
- ⬜ 8.1.1 Create `candidate_accounts` table
- ⬜ 8.1.2 Create candidate registration page (/portal/register)
- ⬜ 8.1.3 Create candidate login page (/portal/login)
- ⬜ 8.1.4 Implement email/password authentication
- ⬜ 8.1.5 Implement Google OAuth for candidates
- ⬜ 8.1.6 Implement LinkedIn OAuth for candidates
- ⬜ 8.1.7 Create email verification flow
- ⬜ 8.1.8 Create password reset flow
- ⬜ 8.1.9 Create candidate session management

## 8.2 Portal Layout
- ⬜ 8.2.1 Create portal layout (separate from dashboard)
- ⬜ 8.2.2 Create portal header with navigation
- ⬜ 8.2.3 Create portal sidebar/menu
- ⬜ 8.2.4 Make portal fully responsive (mobile-first)
- ⬜ 8.2.5 Support RTL layout in portal

## 8.3 Application Tracking
- ⬜ 8.3.1 Create /portal page (candidate dashboard)
- ⬜ 8.3.2 Create /portal/applications page (list all applications)
- ⬜ 8.3.3 Create /portal/applications/[id] page (application detail)
- ⬜ 8.3.4 Display application timeline with stages
- ⬜ 8.3.5 Show current status prominently
- ⬜ 8.3.6 Display any feedback shared with candidate

## 8.4 Interview Self-Scheduling
- ⬜ 8.4.1 Create interviewer availability slots system
- ⬜ 8.4.2 Create /portal/interviews page
- ⬜ 8.4.3 Show available time slots to candidate
- ⬜ 8.4.4 Allow candidate to pick preferred slot
- ⬜ 8.4.5 Confirm and sync to calendars
- ⬜ 8.4.6 Allow reschedule request
- ⬜ 8.4.7 Allow cancellation with reason

## 8.5 Offer Handling
- ⬜ 8.5.1 Create /portal/offers page
- ⬜ 8.5.2 Create /portal/offers/[id] page
- ⬜ 8.5.3 Display offer details
- ⬜ 8.5.4 Allow PDF download
- ⬜ 8.5.5 Create accept offer flow with e-signature
- ⬜ 8.5.6 Create decline offer flow with reason
- ⬜ 8.5.7 Create counter-offer request flow

## 8.6 Profile & Documents
- ⬜ 8.6.1 Create /portal/profile page
- ⬜ 8.6.2 Allow updating contact information
- ⬜ 8.6.3 Allow updating resume
- ⬜ 8.6.4 Create /portal/documents page
- ⬜ 8.6.5 Allow uploading additional documents

---

# SECTION 9: DATABASE SCHEMA COMPLETION (18 Tasks)

## 9.1 Interviews Table Updates
- ⬜ 9.1.1 Add video_platform field (zoom, teams, meet, other)
- ⬜ 9.1.2 Add job_id direct reference
- ⬜ 9.1.3 Add candidate_id direct reference
- ⬜ 9.1.4 Add zoom_meeting_id, zoom_join_url, zoom_start_url
- ⬜ 9.1.5 Add teams_meeting_id, teams_join_url
- ⬜ 9.1.6 Add calendar_provider field

## 9.2 Applications Table Updates
- ⬜ 9.2.1 Add stage_history JSONB field
- ⬜ 9.2.2 Add ai_ranking field
- ⬜ 9.2.3 Add referrer_id field
- ⬜ 9.2.4 Add screening_answers JSONB field

## 9.3 Candidates Table Updates
- ⬜ 9.3.1 Add languages JSONB field
- ⬜ 9.3.2 Add visa_status field
- ⬜ 9.3.3 Add work_permit_country field
- ⬜ 9.3.4 Add gdpr_consent and consent_date fields

## 9.4 Pipeline Stages Updates
- ⬜ 9.4.1 Add requires_approval field
- ⬜ 9.4.2 Add approvers[] field
- ⬜ 9.4.3 Add auto_email_template_id field

## 9.5 Jobs Table Updates
- ⬜ 9.5.1 Add nationality_preferences[] field
- ⬜ 9.5.2 Add visa_sponsorship_available field

---

# SECTION 10: ORGANIZATION ADMIN FEATURES (16 Tasks)

## 10.1 Self-Onboarding
- ⬜ 10.1.1 Create organization signup page
- ⬜ 10.1.2 Create organization setup wizard
- ⬜ 10.1.3 Step 1: Company details
- ⬜ 10.1.4 Step 2: Admin user creation
- ⬜ 10.1.5 Step 3: Branding upload
- ⬜ 10.1.6 Step 4: Subscription selection
- ⬜ 10.1.7 Provision organization automatically

## 10.2 User Invitations
- ⬜ 10.2.1 Create user invitation form
- ⬜ 10.2.2 Send invitation email with magic link
- ⬜ 10.2.3 Create invitation acceptance page
- ⬜ 10.2.4 Allow setting role during invitation
- ⬜ 10.2.5 Track pending invitations
- ⬜ 10.2.6 Allow resend/cancel invitation

## 10.3 Subscription Self-Management
- ⬜ 10.3.1 Display current subscription details
- ⬜ 10.3.2 Create upgrade/downgrade flow
- ⬜ 10.3.3 Integrate with payment provider (Stripe)
- ⬜ 10.3.4 Show usage limits and current usage

## 10.4 Usage Tracking
- ⬜ 10.4.1 Track jobs count vs limit
- ⬜ 10.4.2 Track candidates count vs limit
- ⬜ 10.4.3 Track users count vs limit
- ⬜ 10.4.4 Track storage usage vs limit
- ⬜ 10.4.5 Show usage dashboard
- ⬜ 10.4.6 Send alerts when approaching limits

---

# SECTION 11: ADVANCED ANALYTICS (15 Tasks)

## 11.1 Hiring Metrics
- ⬜ 11.1.1 Calculate time-to-hire metric
- ⬜ 11.1.2 Calculate time-to-fill metric
- ⬜ 11.1.3 Calculate cost-per-hire metric
- ⬜ 11.1.4 Calculate source effectiveness
- ⬜ 11.1.5 Calculate offer acceptance rate
- ⬜ 11.1.6 Calculate pipeline conversion rates

## 11.2 Recruiter Performance
- ⬜ 11.2.1 Track applications processed per recruiter
- ⬜ 11.2.2 Track interviews scheduled per recruiter
- ⬜ 11.2.3 Track offers made per recruiter
- ⬜ 11.2.4 Track hires per recruiter
- ⬜ 11.2.5 Create recruiter leaderboard

## 11.3 Custom Reports
- ⬜ 11.3.1 Create report builder UI
- ⬜ 11.3.2 Allow selecting metrics and dimensions
- ⬜ 11.3.3 Allow filtering by date range
- ⬜ 11.3.4 Save report templates
- ⬜ 11.3.5 Schedule automated report emails
- ⬜ 11.3.6 Export reports (PDF, Excel, CSV)

---

# SECTION 12: AUDIT LOGGING & SECURITY (13 Tasks)

## 12.1 Audit Logging
- ⬜ 12.1.1 Create `audit_logs` table
- ⬜ 12.1.2 Log all create operations
- ⬜ 12.1.3 Log all update operations (with old/new values)
- ⬜ 12.1.4 Log all delete operations
- ⬜ 12.1.5 Log authentication events
- ⬜ 12.1.6 Log permission changes
- ⬜ 12.1.7 Create audit log viewer UI
- ⬜ 12.1.8 Add filtering and search to audit logs
- ⬜ 12.1.9 Export audit logs

## 12.2 Data Security
- ⬜ 12.2.1 Encrypt sensitive fields in database
- ⬜ 12.2.2 Implement API rate limiting
- ⬜ 12.2.3 Add CSRF protection
- ⬜ 12.2.4 Security headers configuration

---

# SUMMARY

## Task Count by Section

| Section | Tasks | Priority |
|---------|-------|----------|
| 1. User Roles & Permissions | 38 | CRITICAL |
| 2. External Integrations | 42 | HIGH |
| 3. Per-Org Email Config | 35 | HIGH |
| 4. Localization (i18n/RTL) | 32 | CRITICAL |
| 5. Compliance (MENA) | 28 | CRITICAL |
| 6. Interview & Hiring | 31 | HIGH |
| 7. Pipeline & Workflow | 22 | MEDIUM |
| 8. Candidate Portal | 27 | HIGH |
| 9. Database Schema | 18 | HIGH |
| 10. Org Admin Features | 16 | MEDIUM |
| 11. Advanced Analytics | 15 | MEDIUM |
| 12. Audit & Security | 13 | MEDIUM |
| **TOTAL** | **247** | |

## Recommended Sprint Order

| Sprint | Section(s) | Duration |
|--------|------------|----------|
| Sprint 4 | Section 1: RBAC | 2 weeks |
| Sprint 5 | Section 4: i18n/RTL | 2 weeks |
| Sprint 6 | Section 5: MENA Compliance | 2 weeks |
| Sprint 7 | Section 2: Integrations (Zoom/Teams) | 2 weeks |
| Sprint 8 | Section 2: Integrations (Outlook) + Section 9: DB Schema | 2 weeks |
| Sprint 9 | Section 3: Email Config | 2 weeks |
| Sprint 10 | Section 6: Interview Scorecards | 2 weeks |
| Sprint 11 | Section 6: Offer Workflow | 2 weeks |
| Sprint 12 | Section 8: Candidate Portal (Auth + Layout) | 2 weeks |
| Sprint 13 | Section 8: Candidate Portal (Features) | 2 weeks |
| Sprint 14 | Section 7: Pipeline/Workflow + Section 10: Org Admin | 2 weeks |
| Sprint 15 | Section 11: Analytics + Section 12: Audit | 2 weeks |

**Total Duration:** 24 weeks (6 months)

---

*This task list should be updated as tasks are completed.*
*Last Updated: January 21, 2026*

---

## Session Notes for Future Claude Sessions

**Current Blocker:** Authentication redirect loop on production. See top of this document for details.

**What Works:**
- Login authentication succeeds (user/password validated)
- RootRedirect correctly identifies user role and redirects
- All other features work once authenticated (tested locally?)

**What's Broken:**
- Session not persisting after redirect from login → /admin
- `supabase.auth.getSession()` times out on /admin page
- `jadarat_pending_session` localStorage key is cleared too early

**Next Action:** Fix the session persistence issue before any other work can proceed.
