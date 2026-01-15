# Jadarat ATS - Lovable Development BRD
## AI-Powered Applicant Tracking System for MENA Region

**Version:** 2.0 (Lovable-Optimized)
**Target Platform:** Lovable AI Development
**Tech Stack:** Next.js + Lovable Components + Supabase + Resend
**Target Market:** MENA Region (Saudi Arabia, UAE, Egypt, GCC)
**Development Timeline:** Iterative 4-week sprints
**Language Support:** Arabic (RTL) + English

---

## 🎯 Executive Summary

Jadarat ATS is a **true SaaS, multi-tenant, AI-powered** Applicant Tracking System designed specifically for MENA organizations. Built on Lovable's component library with Next.js and Supabase backend, the platform provides:

- **Super Admin Control:** Jadarat manages organizations, subscriptions, and platform configuration
- **Org-Level Multi-Tenancy:** Each organization operates in complete isolation with white-label capabilities
- **Arabic-First Design:** Full RTL support, bilingual UI, Arabic NLP for AI features
- **AI-Powered Recruitment:** Resume parsing, candidate scoring, intelligent matching, screening suggestions
- **MENA Compliance:** Saudization/Emiratization tracking, PDPL compliance, data residency
- **Customizable Workflows:** Per-organization hiring pipelines, stages, permissions
- **Branded Career Portals:** White-labeled candidate experience with custom domains
- **Real-Time Analytics:** Dashboards, reports, compliance tracking

**Key Differentiator:** Only Arabic-native, AI-first ATS built specifically for MENA compliance and user experience.

---

## 📋 Table of Contents

1. [Product Vision & Goals](#1-product-vision--goals)
2. [User Personas](#2-user-personas)
3. [Technical Architecture](#3-technical-architecture)
4. [Data Models & Database Schema](#4-data-models--database-schema)
5. [Functional Requirements by Module](#5-functional-requirements-by-module)
6. [User Interface Specifications](#6-user-interface-specifications)
7. [AI/ML Specifications](#7-aiml-specifications)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Development Phases & Milestones](#9-development-phases--milestones)
10. [Testing & Quality Assurance](#10-testing--quality-assurance)

---

## 1. Product Vision & Goals

### 1.1 Business Objectives

| Objective | Target | Timeline |
|-----------|--------|----------|
| **Client Acquisition** | 15 paying organizations | 12 months |
| **Time-to-Hire Reduction** | 30% improvement | Per client |
| **User Satisfaction** | NPS 40+ | Ongoing |
| **Platform Users** | 5,000+ monthly active recruiters | 12 months |
| **Compliance** | 100% MENA regulatory compliance | Day 1 |
| **System Uptime** | 99.9% availability | Ongoing |

### 1.2 User Success Goals

**For Recruiters:**
- Reduce manual resume screening time by 80%
- AI-powered candidate ranking with 90%+ accuracy
- Mobile-optimized interface (80% MENA users on mobile)
- Real-time collaboration with hiring teams

**For HR Managers:**
- Full control over hiring workflows and compliance
- Configurable pipelines per job/department/location
- Real-time analytics and compliance reporting
- Self-serve organization management

**For Candidates:**
- 5-minute application process
- Mobile-first experience
- Language preference (Arabic/English)
- Real-time status updates

**For Jadarat (Platform Owner):**
- Central control over all organizations
- Flexible tier management and pricing
- Subscription lifecycle management
- Platform-wide analytics

### 1.3 Non-Goals (Out of Scope for MVP)

- ❌ On-premise deployment (SaaS only)
- ❌ Full HRIS/payroll features (focus on ATS)
- ❌ SMS/WhatsApp notifications (email only)
- ❌ Geographic expansion beyond MENA (Year 1)
- ❌ Native mobile apps (PWA sufficient for MVP)
- ❌ Job board API integrations (manual posting for MVP)

---

## 2. User Personas

### Persona 1: Jadarat Super Admin
**Name:** Platform Administrator
**Role:** Manages entire SaaS platform
**Goals:**
- Create and manage organizations (tenants)
- Configure subscription tiers and pricing
- Monitor platform health and usage
- Enforce compliance and data residency
- Manage platform-wide settings

**Key Tasks:**
- Organization onboarding and provisioning
- Subscription management (create tiers, assign, upgrade/downgrade)
- Payment tracking and billing
- Platform configuration (languages, features, integrations)
- Global analytics and reporting
- User support and issue resolution

**Pain Points:**
- Manual provisioning is time-consuming
- No visibility into organization health
- Difficulty managing custom pricing

**Success Metrics:**
- Organizations onboarded per month
- Platform uptime
- Support ticket resolution time

---

### Persona 2: Organization Admin
**Name:** Fatima Al-Qasimi
**Role:** HR Director at Saudi Bank
**Organization:** 500 employees, 5 branches
**Goals:**
- Self-serve onboard organization
- Manage users, roles, permissions
- Configure company branding
- Ensure Saudization compliance
- Monitor hiring metrics

**Key Tasks:**
- Organization setup (logo, colors, domains)
- User management (add recruiters, set permissions)
- Department and location setup
- Compliance configuration (Saudization targets)
- Career portal customization
- Subscription management

**Pain Points:**
- Existing ATS doesn't support Arabic properly
- Saudization tracking is manual
- Cannot customize hiring workflows
- Poor mobile experience for recruiters

**Success Metrics:**
- Time to onboard new recruiters (<10 minutes)
- Saudization quota achievement
- Recruiter adoption rate

---

### Persona 3: HR Manager
**Name:** Ahmed Hassan
**Role:** HR Manager at UAE Healthcare Group
**Organization:** 200 employees, high-volume hiring
**Goals:**
- Design custom hiring workflows
- Manage email templates
- Track compliance and diversity
- Generate hiring reports

**Key Tasks:**
- Create hiring pipelines (screening → interview → offer)
- Configure screening questions per job
- Set up interview workflows
- Manage email templates (Arabic/English)
- Run analytics reports
- Export data for audits

**Pain Points:**
- One-size-fits-all workflows don't work
- Cannot customize stages per job type
- Reporting is inadequate
- Arabic templates are poor quality

**Success Metrics:**
- Workflow configuration time (<30 minutes)
- Report generation speed (<30 seconds)
- Hiring process compliance (100%)

---

### Persona 4: Recruiter
**Name:** Sara Al-Mansouri
**Role:** Senior Recruiter at Tech Startup
**Organization:** 50 employees, fast growth
**Goals:**
- Post jobs quickly (Arabic + English)
- Get AI-powered candidate recommendations
- Manage interviews efficiently
- Communicate with candidates

**Key Tasks:**
- Create job postings (bilingual)
- Review AI-ranked candidates
- Screen applications
- Schedule interviews
- Send offer letters
- Collaborate with hiring managers

**Pain Points:**
- Reviewing 100+ applications manually
- No AI to help prioritize candidates
- Calendar management is messy
- Switching between Arabic/English is clunky

**Success Metrics:**
- Time to shortlist candidates (<30 minutes per job)
- Interview scheduling time (<5 minutes)
- Candidate response rate (>60%)

---

### Persona 5: Hiring Manager
**Name:** Khalid Al-Rashid
**Role:** Engineering Director
**Organization:** Tech company, expanding team
**Goals:**
- Review qualified candidates only
- Provide interview feedback
- Approve job requisitions
- Make fast hiring decisions

**Key Tasks:**
- Approve job requisitions
- Review shortlisted candidates
- Conduct interviews
- Submit interview scorecards
- Approve offers

**Pain Points:**
- Too many unqualified referrals
- No standardized interview process
- Cannot see hiring pipeline status
- Feedback process is manual

**Success Metrics:**
- Time to review candidates (<15 minutes per role)
- Interview completion rate (100%)
- Time to decision (<24 hours after final interview)

---

### Persona 6: Job Candidate
**Name:** Mohammed Khan
**Role:** Software Developer
**Location:** Dubai, UAE
**Goals:**
- Find relevant jobs
- Easy application process
- Get timely updates
- Professional experience

**Key Tasks:**
- Search for jobs
- Submit applications
- Upload CV (Arabic or English)
- Track application status
- Schedule interviews
- Accept offers

**Pain Points:**
- Application forms are too long
- No status updates after applying
- Mobile application is difficult
- Sites are not in Arabic

**Success Metrics:**
- Application completion time (<5 minutes)
- Application completion rate (>85%)
- Response satisfaction (4+/5)

---

## 3. Technical Architecture

### 3.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                           │
│                                                               │
│  Framework:  Next.js 14+ (App Router)                       │
│  UI Library: Lovable Component Library                       │
│  Styling:    Tailwind CSS (with RTL support)                │
│  State:      React Context + Server Components               │
│  i18n:       next-intl (Arabic/English)                     │
│  Forms:      React Hook Form + Zod validation               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER                                 │
│                                                               │
│  Framework:  Next.js API Routes / Server Actions            │
│  Auth:       Supabase Auth (JWT-based)                      │
│  Middleware: Row-Level Security (RLS)                       │
│  Validation: Zod schemas                                     │
│  AI:         Lovable AI (built-in capabilities)             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                              │
│                                                               │
│  Database:   Supabase (PostgreSQL 15+)                      │
│  Security:   Row-Level Security (RLS)                       │
│  Storage:    Supabase Storage (CVs, documents)              │
│  Realtime:   Supabase Realtime (live updates)               │
│  Backups:    Automated daily backups                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                           │
│                                                               │
│  Email:      Resend (transactional emails)                  │
│  Calendar:   Google Calendar API, Outlook API               │
│  Video:      Zoom API, Microsoft Teams API                  │
│  Analytics:  Plausible or Supabase Analytics                │
│  Monitoring: Sentry (error tracking)                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Multi-Tenant Architecture

**Isolation Strategy:** Shared database with `org_id` column (Row-Level Security)

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN LAYER                          │
│                                                               │
│  - Manages all organizations (tenants)                       │
│  - Configures subscription tiers                             │
│  - Platform-wide settings                                    │
│  - Billing and payment tracking                              │
│  - Full access to all data (auditing only)                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  ORG A       │  ORG B       │  ORG C       │  ORG N       │
│  (Isolated)  │  (Isolated)  │  (Isolated)  │  (Isolated)  │
│              │              │              │              │
│  - Own users │  - Own users │  - Own users │  - Own users │
│  - Own data  │  - Own data  │  - Own data  │  - Own data  │
│  - Own brand │  - Own brand │  - Own brand │  - Own brand │
│  - Own tier  │  - Own tier  │  - Own tier  │  - Own tier  │
│              │              │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## 4. Data Models & Database Schema

### 4.1 Core Tables

#### Organizations Table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1a73e8',
  secondary_color VARCHAR(7) DEFAULT '#34a853',
  custom_domain VARCHAR(255),
  default_language VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
  tier_id UUID REFERENCES subscription_tiers(id),
  subscription_status VARCHAR(20) DEFAULT 'trial',
  subscription_start_date DATE,
  subscription_end_date DATE,
  data_residency VARCHAR(50) DEFAULT 'mena',
  saudization_enabled BOOLEAN DEFAULT false,
  saudization_target_percentage DECIMAL(5,2),
  emiratization_enabled BOOLEAN DEFAULT false,
  emiratization_target_percentage DECIMAL(5,2),
  max_jobs INTEGER DEFAULT 10,
  max_candidates INTEGER DEFAULT 1000,
  max_users INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

#### Subscription Tiers Table
```sql
CREATE TABLE subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  description TEXT,
  description_ar TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  max_jobs INTEGER NOT NULL,
  max_candidates INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  max_storage_gb INTEGER NOT NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  org_id UUID REFERENCES organizations(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL,
  department VARCHAR(100),
  language_preference VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Jobs Table
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  job_code VARCHAR(50),
  department VARCHAR(100),
  location VARCHAR(255),
  employment_type VARCHAR(50),
  remote_type VARCHAR(50),
  description TEXT NOT NULL,
  description_ar TEXT,
  responsibilities TEXT,
  responsibilities_ar TEXT,
  requirements TEXT,
  requirements_ar TEXT,
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  salary_currency VARCHAR(3) DEFAULT 'USD',
  salary_period VARCHAR(20) DEFAULT 'yearly',
  positions_available INTEGER DEFAULT 1,
  experience_level VARCHAR(50),
  education_level VARCHAR(100),
  pipeline_id UUID REFERENCES pipelines(id),
  created_by UUID REFERENCES users(id),
  assigned_recruiters UUID[],
  hiring_manager_id UUID REFERENCES users(id),
  requires_saudization BOOLEAN DEFAULT false,
  requires_emiratization BOOLEAN DEFAULT false,
  nationality_preferences VARCHAR(50)[],
  visa_sponsorship_available BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Candidates Table
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(100),
  nationality VARCHAR(100),
  current_job_title VARCHAR(255),
  current_company VARCHAR(255),
  years_of_experience INTEGER,
  highest_education VARCHAR(100),
  university VARCHAR(255),
  field_of_study VARCHAR(255),
  graduation_year INTEGER,
  skills TEXT[],
  languages JSONB,
  resume_url TEXT,
  resume_text TEXT,
  portfolio_url TEXT,
  cover_letter_text TEXT,
  visa_status VARCHAR(50),
  requires_sponsorship BOOLEAN DEFAULT false,
  work_permit_country VARCHAR(100),
  ai_parsed_data JSONB,
  ai_skills JSONB,
  ai_summary TEXT,
  overall_status VARCHAR(50) DEFAULT 'new',
  source VARCHAR(100),
  gdpr_consent BOOLEAN DEFAULT false,
  gdpr_consent_date TIMESTAMPTZ,
  can_contact BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Applications Table
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(100),
  referrer_id UUID REFERENCES users(id),
  screening_answers JSONB,
  current_stage_id UUID REFERENCES pipeline_stages(id),
  stage_history JSONB[],
  ai_match_score DECIMAL(5,2),
  ai_match_explanation TEXT,
  ai_ranking INTEGER,
  status VARCHAR(50) DEFAULT 'new',
  rejection_reason VARCHAR(255),
  rejection_note TEXT,
  assigned_recruiter_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);
```

#### Pipelines & Stages Tables
```sql
CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  sort_order INTEGER NOT NULL,
  stage_type VARCHAR(50),
  is_mandatory BOOLEAN DEFAULT true,
  auto_email_template_id UUID REFERENCES email_templates(id),
  requires_approval BOOLEAN DEFAULT false,
  approvers UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Interviews Table
```sql
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  interview_type VARCHAR(50),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location VARCHAR(255),
  video_meeting_link TEXT,
  video_platform VARCHAR(50),
  interviewers UUID[] NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  feedback JSONB[],
  overall_recommendation VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

---

## 5. Development Phases

### Phase 1: Core ATS MVP (Weeks 2-7)
- Auth & Multi-Tenancy
- Job & Application Management
- Candidate Management & Pipeline

### Phase 2: AI & Localization (Weeks 8-11)
- Lovable AI Integration
- Resume Parsing
- Candidate Scoring
- Arabic Language Support

### Phase 3: Communication & Interviews (Weeks 12-14)
- Email Management
- Interview Scheduling
- Calendar Integration

### Phase 4: Analytics & Compliance (Weeks 15-17)
- Analytics Dashboard
- Saudization/Emiratization Tracking
- PDPL Compliance

### Phase 5: Polish & Launch (Weeks 18-20)
- Bug Fixes
- Performance Optimization
- Security Hardening
- UAT

---

*Full BRD details available in the complete document.*
