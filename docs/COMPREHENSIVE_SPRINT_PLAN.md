# Jadarat ATS - Comprehensive Sprint Plan
## Complete BRD Implementation Roadmap

**Created:** January 17, 2026
**Total Estimated Sprints:** 12 (2-week sprints = 24 weeks)
**Current Progress:** ~35-40%

---

## EXECUTIVE SUMMARY

### What We Have Built
- Super Admin Dashboard (partial)
- Organizations CRUD
- Subscription Tiers CRUD
- Jobs Management (English only)
- Candidates Management
- Applications Pipeline
- AI Resume Parsing (Claude)
- AI Candidate Scoring
- AI Job Description Generator
- Interview Scheduling (basic)
- Google Calendar Integration
- Email Templates (basic)
- Resend Email Integration (global only)
- Public Career Pages
- Notifications System (polling)
- Workflows Engine (basic)
- Document Management
- Bulk Actions

### What We're Missing (Critical)
- Arabic/RTL/i18n Support (CORE DIFFERENTIATOR)
- Role-Based Access Control (6 distinct roles)
- Zoom Integration
- Microsoft Teams Integration
- Outlook Calendar Integration
- Per-Organization Email Configuration (SMTP/IMAP)
- Candidate Self-Service Portal
- Interview Scorecards
- Offer Workflow
- Saudization/Emiratization Real Tracking
- PDPL Compliance
- And much more...

---

## SPRINT 4: ROLE-BASED ACCESS CONTROL (RBAC)
**Duration:** 2 weeks
**Priority:** CRITICAL
**Dependency:** Foundation for all other features

### 4.1 Database Schema for Roles & Permissions
```sql
-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id), -- NULL for system roles
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  category VARCHAR(50),
  description TEXT
);

-- Role permissions junction
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User roles junction
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (user_id, role_id, org_id)
);
```

### 4.2 System Roles (BRD Section 2)
| Role | Level | Description |
|------|-------|-------------|
| super_admin | Platform | Jadarat platform administrator |
| org_admin | Organization | Organization administrator (HR Director) |
| hr_manager | Organization | HR Manager - workflows, templates, compliance |
| recruiter | Organization | Recruiter - jobs, candidates, interviews |
| hiring_manager | Organization | Hiring Manager - review, approve, feedback |
| candidate | External | Job applicant (separate auth) |

### 4.3 Permission Categories
```
JOBS:
- jobs.create, jobs.read, jobs.update, jobs.delete
- jobs.publish, jobs.close, jobs.approve_requisition

CANDIDATES:
- candidates.create, candidates.read, candidates.update, candidates.delete
- candidates.export, candidates.bulk_actions

APPLICATIONS:
- applications.read, applications.update, applications.move_stage
- applications.reject, applications.shortlist

INTERVIEWS:
- interviews.create, interviews.read, interviews.update, interviews.cancel
- interviews.submit_scorecard, interviews.view_feedback

OFFERS:
- offers.create, offers.read, offers.update
- offers.approve, offers.send, offers.rescind

ORGANIZATION:
- org.settings, org.branding, org.users, org.roles
- org.departments, org.locations, org.pipelines

ANALYTICS:
- analytics.view_dashboard, analytics.export_reports
- analytics.compliance_reports

COMPLIANCE:
- compliance.view, compliance.configure, compliance.export
```

### 4.4 Role-Specific Dashboards
| Role | Dashboard Content |
|------|-------------------|
| Super Admin | Platform stats, all orgs, billing, system health |
| Org Admin | Org overview, users, compliance, subscription |
| HR Manager | Hiring metrics, workflows, templates, compliance |
| Recruiter | My jobs, my candidates, my interviews, tasks |
| Hiring Manager | Pending reviews, interviews, approvals |

### 4.5 Deliverables
- [ ] Database migrations for RBAC
- [ ] Permission seeding script
- [ ] Role assignment UI
- [ ] Permission checking middleware
- [ ] Role-based sidebar navigation
- [ ] Role-specific dashboard components
- [ ] withPermission HOC / usePermission hook

---

## SPRINT 5: INTERNATIONALIZATION (i18n) & RTL
**Duration:** 2 weeks
**Priority:** CRITICAL (Core MENA Differentiator)

### 5.1 i18n Setup
- [ ] Install and configure next-intl
- [ ] Create locale files structure
- [ ] Implement language switcher component
- [ ] Add language preference to user profile
- [ ] Cookie-based locale persistence

### 5.2 Translation Files Structure
```
/messages
  /en
    common.json
    auth.json
    dashboard.json
    jobs.json
    candidates.json
    applications.json
    interviews.json
    settings.json
    errors.json
  /ar
    common.json
    auth.json
    dashboard.json
    jobs.json
    candidates.json
    applications.json
    interviews.json
    settings.json
    errors.json
```

### 5.3 RTL Layout Support
- [ ] Configure Tailwind for RTL
- [ ] Create RTL-aware components
- [ ] Update all layouts for dir="rtl"
- [ ] Fix icon directions (arrows, etc.)
- [ ] Test all pages in RTL mode

### 5.4 Bilingual Content
- [ ] Job titles (title / title_ar)
- [ ] Job descriptions (description / description_ar)
- [ ] Email templates (subject_ar, body_ar)
- [ ] Pipeline stages (name_ar)
- [ ] Department names (name_ar)
- [ ] Location names (name_ar)

### 5.5 Arabic UI Components
- [ ] Arabic date picker (Hijri calendar option)
- [ ] Arabic number formatting
- [ ] Arabic currency formatting
- [ ] Arabic phone input

### 5.6 Deliverables
- [ ] Complete English translations
- [ ] Complete Arabic translations
- [ ] RTL stylesheet
- [ ] Language switcher in header
- [ ] All forms support bilingual input
- [ ] Arabic email template variants

---

## SPRINT 6: VIDEO CONFERENCING INTEGRATIONS
**Duration:** 2 weeks
**Priority:** HIGH

### 6.1 Zoom Integration
```typescript
// /src/lib/integrations/zoom.ts
- OAuth 2.0 authentication flow
- Create meeting API
- Get meeting details
- Update/cancel meeting
- Meeting webhook handlers
```

**Zoom API Endpoints:**
- POST /users/{userId}/meetings - Create meeting
- GET /meetings/{meetingId} - Get meeting
- PATCH /meetings/{meetingId} - Update meeting
- DELETE /meetings/{meetingId} - Delete meeting

**Database:**
```sql
-- Add to user_integrations
-- provider: 'zoom'
-- Store: access_token, refresh_token, user_id (Zoom)

-- Add to interviews table
ALTER TABLE interviews ADD COLUMN zoom_meeting_id VARCHAR(255);
ALTER TABLE interviews ADD COLUMN zoom_join_url TEXT;
ALTER TABLE interviews ADD COLUMN zoom_start_url TEXT;
```

### 6.2 Microsoft Teams Integration
```typescript
// /src/lib/integrations/teams.ts
- Microsoft Graph API OAuth
- Create online meeting
- Get meeting details
- Update/cancel meeting
```

**MS Graph Endpoints:**
- POST /users/{userId}/onlineMeetings - Create meeting
- GET /users/{userId}/onlineMeetings/{meetingId} - Get meeting
- DELETE /users/{userId}/onlineMeetings/{meetingId} - Delete meeting

**Database:**
```sql
-- Add to user_integrations
-- provider: 'microsoft'
-- Store: access_token, refresh_token, microsoft_user_id

-- Add to interviews table
ALTER TABLE interviews ADD COLUMN teams_meeting_id VARCHAR(255);
ALTER TABLE interviews ADD COLUMN teams_join_url TEXT;
```

### 6.3 Outlook Calendar Integration
```typescript
// /src/lib/integrations/outlook-calendar.ts
- Microsoft Graph API for Calendar
- Create calendar event
- Sync events
- Get free/busy status
```

### 6.4 Video Platform Selector UI
- [ ] Platform selection in interview scheduling
- [ ] Connect accounts in settings
- [ ] Auto-generate meeting links
- [ ] Display correct platform icon
- [ ] One-click join from interview card

### 6.5 Deliverables
- [ ] Zoom OAuth flow & API integration
- [ ] Teams OAuth flow & API integration
- [ ] Outlook Calendar integration
- [ ] Video platform selector in interview form
- [ ] Integration settings page
- [ ] Meeting link auto-generation
- [ ] Webhook handlers for meeting events

---

## SPRINT 7: PER-ORGANIZATION EMAIL CONFIGURATION
**Duration:** 2 weeks
**Priority:** HIGH

### 7.1 Database Schema
```sql
CREATE TABLE organization_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

  -- Sending Configuration
  email_provider VARCHAR(50) DEFAULT 'resend', -- 'resend', 'smtp', 'sendgrid', 'mailgun'
  resend_api_key TEXT, -- Encrypted
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  smtp_username VARCHAR(255),
  smtp_password TEXT, -- Encrypted
  smtp_encryption VARCHAR(10) DEFAULT 'tls', -- 'tls', 'ssl', 'none'

  -- From Address
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  reply_to_email VARCHAR(255),

  -- IMAP Configuration (for email sync)
  imap_enabled BOOLEAN DEFAULT false,
  imap_host VARCHAR(255),
  imap_port INTEGER DEFAULT 993,
  imap_username VARCHAR(255),
  imap_password TEXT, -- Encrypted
  imap_encryption VARCHAR(10) DEFAULT 'ssl',

  -- Email Tracking
  track_opens BOOLEAN DEFAULT true,
  track_clicks BOOLEAN DEFAULT true,

  -- Verification
  domain_verified BOOLEAN DEFAULT false,
  dkim_configured BOOLEAN DEFAULT false,
  spf_configured BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  message_id VARCHAR(255),
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  template_id UUID REFERENCES email_templates(id),
  status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, opened, clicked, bounced, failed
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 Email Service Abstraction
```typescript
// /src/lib/email/email-service.ts
interface EmailProvider {
  send(options: EmailOptions): Promise<EmailResult>
  verifyDomain(domain: string): Promise<VerificationResult>
}

class ResendProvider implements EmailProvider { }
class SMTPProvider implements EmailProvider { }
class SendGridProvider implements EmailProvider { }

function getEmailProvider(orgId: string): EmailProvider
```

### 7.3 IMAP Integration
- [ ] Sync incoming emails
- [ ] Match emails to candidates
- [ ] Display email thread in candidate view
- [ ] Reply to emails from within ATS

### 7.4 Email Tracking
- [ ] Open tracking pixel
- [ ] Click tracking links
- [ ] Delivery status webhooks
- [ ] Bounce handling
- [ ] Analytics dashboard

### 7.5 UI Components
- [ ] Email settings page in org settings
- [ ] SMTP configuration form
- [ ] Domain verification wizard
- [ ] Email logs viewer
- [ ] Email analytics

### 7.6 Deliverables
- [ ] Database migration for email settings
- [ ] Multi-provider email service
- [ ] SMTP configuration UI
- [ ] IMAP sync service
- [ ] Email tracking system
- [ ] Domain verification flow
- [ ] Email logs and analytics

---

## SPRINT 8: CANDIDATE PORTAL
**Duration:** 2 weeks
**Priority:** HIGH (BRD Persona 6)

### 8.1 Candidate Authentication
```sql
CREATE TABLE candidate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT, -- For email/password auth
  auth_provider VARCHAR(50), -- 'email', 'google', 'linkedin'
  provider_id VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.2 Portal Features
| Feature | Description |
|---------|-------------|
| Job Search | Browse & search available jobs |
| My Applications | View all applications & status |
| Application Detail | See current stage, timeline, feedback |
| Documents | Upload additional documents |
| Interview Schedule | View scheduled interviews |
| Self-Scheduling | Pick from available slots |
| Offer Review | View & respond to offers |
| Profile | Update contact info, resume |
| Notifications | Email & in-app notifications |

### 8.3 Application Status Tracking
```typescript
interface ApplicationTimeline {
  stage: string
  status: 'completed' | 'current' | 'upcoming'
  date?: Date
  feedback?: string // Optional feedback for candidate
}
```

### 8.4 Interview Self-Scheduling
- [ ] Interviewer availability slots
- [ ] Candidate picks preferred slot
- [ ] Automatic calendar sync
- [ ] Reschedule requests
- [ ] Cancellation flow

### 8.5 Offer Management
- [ ] View offer details
- [ ] Download offer letter PDF
- [ ] Accept offer (digital signature)
- [ ] Decline offer (with reason)
- [ ] Counter-offer request

### 8.6 Portal Routes
```
/portal                    - Candidate dashboard
/portal/login              - Candidate login
/portal/register           - Candidate registration
/portal/applications       - My applications
/portal/applications/[id]  - Application detail
/portal/interviews         - My interviews
/portal/interviews/[id]    - Interview detail
/portal/offers             - My offers
/portal/offers/[id]        - Offer detail
/portal/profile            - My profile
/portal/documents          - My documents
```

### 8.7 Deliverables
- [ ] Candidate authentication system
- [ ] Portal layout and navigation
- [ ] Application tracking dashboard
- [ ] Interview self-scheduling
- [ ] Offer acceptance flow
- [ ] Document upload
- [ ] Profile management
- [ ] Mobile-responsive design

---

## SPRINT 9: INTERVIEW SCORECARDS & FEEDBACK
**Duration:** 2 weeks
**Priority:** HIGH

### 9.1 Database Schema
```sql
CREATE TABLE scorecard_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  criteria JSONB NOT NULL, -- Array of scoring criteria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criteria JSONB structure:
-- [
--   {
--     "id": "uuid",
--     "name": "Technical Skills",
--     "name_ar": "المهارات التقنية",
--     "description": "Evaluate coding ability",
--     "weight": 30,
--     "rating_scale": 5,
--     "required": true
--   }
-- ]

CREATE TABLE interview_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES auth.users(id),
  template_id UUID REFERENCES scorecard_templates(id),
  ratings JSONB NOT NULL, -- { "criteria_id": { "score": 4, "notes": "..." } }
  overall_score DECIMAL(5,2),
  overall_recommendation VARCHAR(50), -- 'strong_yes', 'yes', 'neutral', 'no', 'strong_no'
  strengths TEXT,
  weaknesses TEXT,
  additional_notes TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.2 Scorecard Templates
- [ ] Default templates per interview type
- [ ] Custom template builder
- [ ] Criteria management
- [ ] Weight configuration
- [ ] Rating scale options (1-5, 1-10, custom)

### 9.3 Scorecard Submission
- [ ] Pre-interview: View candidate profile, resume
- [ ] During/After: Fill scorecard
- [ ] Rating per criteria
- [ ] Notes per criteria
- [ ] Overall recommendation
- [ ] Strengths & weaknesses
- [ ] Submit & lock scorecard

### 9.4 Feedback Aggregation
- [ ] Combine scores from multiple interviewers
- [ ] Weighted average calculation
- [ ] Consensus view
- [ ] Comparison charts
- [ ] Red flags highlighting

### 9.5 Hiring Manager View
- [ ] See all interview feedback
- [ ] Compare candidates side-by-side
- [ ] Make hiring decision
- [ ] Add decision notes

### 9.6 Deliverables
- [ ] Scorecard template builder
- [ ] Scorecard submission form
- [ ] Multi-interviewer feedback view
- [ ] Score aggregation logic
- [ ] Candidate comparison tool
- [ ] Hiring decision workflow

---

## SPRINT 10: OFFER WORKFLOW
**Duration:** 2 weeks
**Priority:** HIGH

### 10.1 Database Schema
```sql
CREATE TABLE offer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  content TEXT NOT NULL, -- HTML with placeholders
  content_ar TEXT,
  variables JSONB, -- Available merge fields
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  application_id UUID REFERENCES applications(id),
  candidate_id UUID REFERENCES candidates(id),
  job_id UUID REFERENCES jobs(id),

  -- Offer Details
  template_id UUID REFERENCES offer_templates(id),
  position_title VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  reporting_to VARCHAR(255),
  start_date DATE,
  employment_type VARCHAR(50),

  -- Compensation
  salary_amount DECIMAL(12,2),
  salary_currency VARCHAR(3) DEFAULT 'SAR',
  salary_period VARCHAR(20) DEFAULT 'yearly',
  bonus_amount DECIMAL(12,2),
  bonus_type VARCHAR(50),
  equity_amount VARCHAR(100),

  -- Benefits
  benefits JSONB,

  -- Documents
  offer_letter_url TEXT,
  signed_offer_url TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'draft',
  -- draft, pending_approval, approved, sent, viewed, accepted, declined, expired, rescinded

  -- Approval
  requires_approval BOOLEAN DEFAULT true,
  approval_chain UUID[], -- Array of user IDs
  current_approver_id UUID,
  approved_at TIMESTAMPTZ,
  approved_by UUID,

  -- Candidate Response
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response VARCHAR(50), -- accepted, declined, counter
  decline_reason TEXT,
  counter_offer_details JSONB,

  -- Signature
  signature_requested BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  signature_ip VARCHAR(45),

  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE offer_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  notes TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.2 Offer Creation Flow
1. Select candidate & job
2. Choose offer template
3. Fill compensation details
4. Preview offer letter
5. Set approval chain (if required)
6. Submit for approval

### 10.3 Approval Workflow
- [ ] Sequential approvals
- [ ] Parallel approvals option
- [ ] Approval notifications
- [ ] Approval reminders
- [ ] Rejection with notes
- [ ] Re-submission after changes

### 10.4 Offer Letter Generation
- [ ] Template merge with variables
- [ ] PDF generation
- [ ] Bilingual offers (EN/AR)
- [ ] Company branding
- [ ] Digital signature field

### 10.5 Candidate Offer Experience
- [ ] Email notification
- [ ] View offer in portal
- [ ] Download PDF
- [ ] Accept with e-signature
- [ ] Decline with reason
- [ ] Request counter-offer

### 10.6 Deliverables
- [ ] Offer template builder
- [ ] Offer creation wizard
- [ ] Approval workflow
- [ ] PDF generation
- [ ] E-signature integration
- [ ] Candidate offer portal
- [ ] Offer analytics

---

## SPRINT 11: SAUDIZATION & EMIRATIZATION COMPLIANCE
**Duration:** 2 weeks
**Priority:** CRITICAL (MENA Core)

### 11.1 Database Schema
```sql
CREATE TABLE nationalization_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(50) NOT NULL, -- 'saudi_arabia', 'uae'
  program VARCHAR(50) NOT NULL, -- 'saudization', 'emiratization'
  category_name VARCHAR(255) NOT NULL,
  category_name_ar VARCHAR(255),
  min_percentage DECIMAL(5,2) NOT NULL,
  max_percentage DECIMAL(5,2),
  entity_size_min INTEGER,
  entity_size_max INTEGER,
  sector VARCHAR(100),
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employee_nationalization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  employee_id UUID, -- Reference to HRIS or internal ID
  candidate_id UUID REFERENCES candidates(id), -- If hired through ATS
  full_name VARCHAR(255) NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  is_national BOOLEAN NOT NULL, -- Saudi/Emirati
  employment_type VARCHAR(50),
  department VARCHAR(100),
  job_category VARCHAR(100),
  hire_date DATE,
  termination_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  report_type VARCHAR(50), -- 'saudization', 'emiratization', 'nitaqat'
  period_start DATE,
  period_end DATE,
  total_employees INTEGER,
  national_employees INTEGER,
  current_percentage DECIMAL(5,2),
  target_percentage DECIMAL(5,2),
  category VARCHAR(100),
  status VARCHAR(50), -- 'compliant', 'at_risk', 'non_compliant'
  details JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID
);
```

### 11.2 Saudization (Nitaqat) Features
- [ ] Company size classification
- [ ] Sector-based requirements
- [ ] Current ratio calculation
- [ ] Target tracking
- [ ] Nitaqat band display (Platinum, Green, Yellow, Red)
- [ ] Hiring impact simulation
- [ ] Compliance forecasting

### 11.3 Emiratization Features
- [ ] Sector-specific quotas
- [ ] Skilled vs unskilled tracking
- [ ] Nafis integration readiness
- [ ] Compliance reporting

### 11.4 Dashboard Components
- [ ] Real-time compliance meter
- [ ] Trend charts (monthly/quarterly)
- [ ] Department breakdown
- [ ] Risk alerts
- [ ] Hiring recommendations

### 11.5 Reporting
- [ ] Monthly compliance report
- [ ] Quarterly trend report
- [ ] Audit-ready exports
- [ ] Government format exports
- [ ] Historical comparisons

### 11.6 Job Posting Integration
- [ ] Flag jobs requiring nationals
- [ ] Filter candidates by nationality
- [ ] Impact on compliance before hire
- [ ] Warnings for non-compliant hires

### 11.7 Deliverables
- [ ] Compliance calculation engine
- [ ] Real-time dashboard
- [ ] Trend analytics
- [ ] Report generation
- [ ] Job posting integration
- [ ] Hiring impact simulator
- [ ] Government export formats

---

## SPRINT 12: JOB REQUISITION & APPROVAL WORKFLOW
**Duration:** 2 weeks
**Priority:** MEDIUM-HIGH

### 12.1 Database Schema
```sql
CREATE TABLE job_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  job_id UUID REFERENCES jobs(id),

  -- Request Details
  requested_by UUID REFERENCES auth.users(id),
  department VARCHAR(100),
  hiring_manager_id UUID REFERENCES auth.users(id),
  business_justification TEXT,
  budget_approved BOOLEAN DEFAULT false,
  budget_amount DECIMAL(12,2),

  -- Approval
  status VARCHAR(50) DEFAULT 'draft',
  -- draft, pending_approval, approved, rejected, cancelled
  approval_chain UUID[],
  current_approver_id UUID,

  -- Dates
  requested_start_date DATE,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE requisition_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID REFERENCES job_requisitions(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id),
  level INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 12.2 Requisition Flow
1. Hiring manager creates job draft
2. Adds business justification
3. Submits for approval
4. Approvers review in sequence
5. Approved → Job can be published
6. Rejected → Sent back with notes

### 12.3 Approval Chain Configuration
- [ ] Department-based approval chains
- [ ] Budget threshold rules
- [ ] Skip levels for certain roles
- [ ] Parallel approvals option
- [ ] Delegation during absence

### 12.4 Deliverables
- [ ] Requisition creation form
- [ ] Approval workflow engine
- [ ] Approver dashboard
- [ ] Email notifications
- [ ] Approval history/audit trail
- [ ] Job posting conditional on approval

---

## SPRINT 13: SCREENING QUESTIONS & ASSESSMENTS
**Duration:** 2 weeks
**Priority:** MEDIUM

### 13.1 Database Schema
```sql
CREATE TABLE screening_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  job_id UUID REFERENCES jobs(id), -- NULL for org-wide questions
  question_text TEXT NOT NULL,
  question_text_ar TEXT,
  question_type VARCHAR(50), -- 'text', 'number', 'select', 'multiselect', 'boolean', 'file'
  options JSONB, -- For select/multiselect
  is_required BOOLEAN DEFAULT false,
  is_knockout BOOLEAN DEFAULT false, -- Auto-reject if wrong answer
  correct_answer JSONB, -- For knockout questions
  weight INTEGER DEFAULT 1,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE screening_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  question_id UUID REFERENCES screening_questions(id),
  response JSONB,
  is_correct BOOLEAN,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  assessment_type VARCHAR(50), -- 'skills', 'personality', 'cognitive', 'technical'
  duration_minutes INTEGER,
  passing_score INTEGER,
  questions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id),
  application_id UUID REFERENCES applications(id),
  candidate_id UUID REFERENCES candidates(id),
  score INTEGER,
  passed BOOLEAN,
  answers JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 13.2 Features
- [ ] Question bank (org-wide)
- [ ] Job-specific questions
- [ ] Knockout questions (auto-reject)
- [ ] Weighted scoring
- [ ] Skills assessments
- [ ] Timed assessments
- [ ] Assessment library
- [ ] Results analytics

### 13.3 Deliverables
- [ ] Question builder
- [ ] Job screening configuration
- [ ] Assessment builder
- [ ] Candidate assessment flow
- [ ] Auto-scoring
- [ ] Results dashboard

---

## SPRINT 14: ADVANCED ANALYTICS & REPORTING
**Duration:** 2 weeks
**Priority:** MEDIUM

### 14.1 Analytics Dashboard Enhancements
- [ ] Time-to-hire metrics
- [ ] Source effectiveness
- [ ] Pipeline conversion rates
- [ ] Recruiter performance
- [ ] Department comparisons
- [ ] Cost per hire
- [ ] Offer acceptance rate

### 14.2 Custom Reports Builder
- [ ] Drag-drop report builder
- [ ] Saved report templates
- [ ] Scheduled report emails
- [ ] Export formats (PDF, Excel, CSV)
- [ ] Share reports with team

### 14.3 Compliance Reports
- [ ] EEO reports
- [ ] Saudization reports
- [ ] Emiratization reports
- [ ] Diversity metrics
- [ ] Government submissions

### 14.4 Deliverables
- [ ] Enhanced analytics dashboard
- [ ] Custom report builder
- [ ] Report scheduling
- [ ] Compliance report templates
- [ ] Data export functionality

---

## SPRINT 15: AUDIT LOGGING & PDPL COMPLIANCE
**Duration:** 2 weeks
**Priority:** MEDIUM

### 15.1 Audit Logging
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  user_id UUID,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 15.2 PDPL/GDPR Compliance
- [ ] Consent management
- [ ] Data retention policies
- [ ] Right to deletion requests
- [ ] Data export requests
- [ ] Consent audit trail
- [ ] Privacy policy acceptance

### 15.3 Deliverables
- [ ] Comprehensive audit logging
- [ ] Audit log viewer
- [ ] Data retention automation
- [ ] DSAR (Data Subject Access Request) workflow
- [ ] Consent management system
- [ ] Privacy compliance dashboard

---

## SUMMARY: ALL SPRINTS

| Sprint | Name | Duration | Priority |
|--------|------|----------|----------|
| 4 | Role-Based Access Control | 2 weeks | CRITICAL |
| 5 | Internationalization (i18n) & RTL | 2 weeks | CRITICAL |
| 6 | Video Conferencing (Zoom/Teams) | 2 weeks | HIGH |
| 7 | Per-Org Email Configuration | 2 weeks | HIGH |
| 8 | Candidate Portal | 2 weeks | HIGH |
| 9 | Interview Scorecards | 2 weeks | HIGH |
| 10 | Offer Workflow | 2 weeks | HIGH |
| 11 | Saudization/Emiratization | 2 weeks | CRITICAL |
| 12 | Job Requisition Approval | 2 weeks | MEDIUM-HIGH |
| 13 | Screening Questions | 2 weeks | MEDIUM |
| 14 | Advanced Analytics | 2 weeks | MEDIUM |
| 15 | Audit & PDPL Compliance | 2 weeks | MEDIUM |

**Total Remaining:** 24 weeks (6 months)

---

## FEATURE CHECKLIST (COMPLETE)

### Core ATS
- [x] Job Management (English)
- [ ] Job Management (Arabic)
- [x] Candidate Management
- [x] Application Pipeline
- [x] Interview Scheduling
- [ ] Interview Scorecards
- [ ] Offer Management
- [ ] Screening Questions
- [ ] Assessments

### Integrations
- [x] Google Calendar
- [ ] Outlook Calendar
- [ ] Zoom
- [ ] Microsoft Teams
- [x] Resend (Global)
- [ ] Per-Org Email/SMTP
- [ ] IMAP Sync

### AI Features
- [x] Resume Parsing
- [x] Candidate Scoring
- [x] Job Description Generator
- [ ] Arabic NLP
- [ ] Interview Question Suggestions (partial)

### User Management
- [ ] Role-Based Access (6 roles)
- [ ] Permission System
- [ ] Role-Specific Dashboards
- [ ] User Invitations

### Localization
- [ ] next-intl Setup
- [ ] English Translations
- [ ] Arabic Translations
- [ ] RTL Layout
- [ ] Language Switcher
- [ ] Bilingual Content

### Compliance
- [ ] Saudization Calculator
- [ ] Emiratization Calculator
- [ ] Nitaqat Bands
- [ ] Compliance Reports
- [ ] PDPL Consent
- [ ] Audit Logging

### Candidate Experience
- [x] Public Career Page
- [x] Job Application Form
- [ ] Candidate Portal
- [ ] Application Tracking
- [ ] Self-Scheduling
- [ ] Offer Acceptance

### Organization
- [x] Org Settings
- [x] Branding
- [x] Departments
- [ ] Self-Onboarding
- [ ] Subscription Self-Manage

### Workflows
- [x] Basic Workflows
- [ ] Job Requisition Approval
- [ ] Offer Approval
- [ ] Stage Approvals

### Analytics
- [x] Basic Dashboard
- [ ] Time-to-Hire
- [ ] Source Effectiveness
- [ ] Custom Reports
- [ ] Report Scheduling

---

*This document should be updated after each sprint completion.*
