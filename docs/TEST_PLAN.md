# Jadarat ATS - Comprehensive Test Plan

**Version:** 1.0
**Date:** 2026-01-31
**Framework:** Vitest + React Testing Library + happy-dom
**Reference:** docs/BRD.md (v2.0)

---

## Table of Contents

1. [Test Strategy Overview](#1-test-strategy-overview)
2. [Test Categories & Approach](#2-test-categories--approach)
3. [Module 1: Authentication & Authorization](#module-1-authentication--authorization)
4. [Module 2: Multi-Tenant Data Isolation](#module-2-multi-tenant-data-isolation)
5. [Module 3: Role-Based Access Control (RBAC)](#module-3-role-based-access-control-rbac)
6. [Module 4: Job Management](#module-4-job-management)
7. [Module 5: Candidate Management](#module-5-candidate-management)
8. [Module 6: Application & Pipeline Management](#module-6-application--pipeline-management)
9. [Module 7: Interview & Scorecards](#module-7-interview--scorecards)
10. [Module 8: Offers Management](#module-8-offers-management)
11. [Module 9: AI/ML Features](#module-9-aiml-features)
12. [Module 10: Email & Notifications](#module-10-email--notifications)
13. [Module 11: Integrations (Calendar, Video, Email Providers)](#module-11-integrations)
14. [Module 12: Analytics & Dashboards](#module-12-analytics--dashboards)
15. [Module 13: Organization Settings & Branding](#module-13-organization-settings--branding)
16. [Module 14: Career Portal (Public)](#module-14-career-portal-public)
17. [Module 15: Candidate Portal](#module-15-candidate-portal)
18. [Module 16: Super Admin Platform](#module-16-super-admin-platform)
19. [Module 17: i18n / Arabic (RTL) Support](#module-17-i18n--arabic-rtl-support)
20. [Module 18: Onboarding Flow](#module-18-onboarding-flow)
21. [Module 19: Documents & Storage](#module-19-documents--storage)
22. [Module 20: Workflow Engine](#module-20-workflow-engine)
23. [BRD Compliance Matrix](#brd-compliance-matrix)
24. [Existing Tests Status](#existing-tests-status)
25. [Priority & Implementation Order](#priority--implementation-order)

---

## 1. Test Strategy Overview

### Goals
- Verify all BRD functional requirements are implemented
- Ensure multi-tenant data isolation (security-critical)
- Validate role-based access control across all routes and APIs
- Test business logic in lib modules (AI, notifications, workflows, analytics)
- Confirm i18n/RTL support for Arabic language

### What We CAN Test (Unit/Integration with Vitest)
- **Lib modules**: Pure functions, business logic, data transformations
- **API routes**: Request/response handling, validation, auth checks, org_id filtering
- **Middleware**: Route protection, role-based access, session handling
- **React components**: Rendering, user interactions, conditional UI
- **Source code verification**: Verify patterns exist (e.g., org_id filtering in queries)

### What We CANNOT Test (Requires E2E / Manual)
- Full Supabase RLS policies (need real database)
- Browser-specific behavior (real DOM, cookies, redirects)
- Third-party API integrations (Zoom, Google, Microsoft live calls)
- Visual/CSS rendering, RTL layout correctness
- Real email delivery

### Test File Naming Convention
```
tests/
  unit/           # Pure function and module tests
  integration/    # API route and cross-module tests
  brd/            # BRD compliance verification tests
  components/     # React component tests
```

---

## 2. Test Categories & Approach

| Category | Approach | Tools | Priority |
|----------|----------|-------|----------|
| **Source verification** | Read source files, verify patterns (org_id, role checks) | `fs.readFileSync` + `expect` | P0 |
| **Unit tests** | Import functions, test with mock data | Vitest + vi.mock | P0 |
| **API route tests** | Import route handlers, test with mock Request objects | Vitest + mock Supabase | P1 |
| **Component tests** | Render components, test interactions | React Testing Library | P2 |
| **BRD compliance** | Verify files/routes/features exist per BRD sections | File system checks | P1 |

---

## Module 1: Authentication & Authorization

**BRD Section:** 3.1, 5 (Phase 1 - Auth & Multi-Tenancy)
**Files:**
- `src/lib/auth/auth-context.tsx` (AuthProvider)
- `src/lib/auth/auth-helpers.ts`
- `src/lib/auth/index.ts`
- `src/lib/supabase/middleware.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/me/route.ts`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 1.1 | AuthProvider initializes with null user/session | Unit | P0 | Existing |
| 1.2 | AuthProvider loads user profile, role, and org on SIGNED_IN event | Unit | P0 | Existing |
| 1.3 | Sign out uses `scope: 'local'` (not global) for performance | Source | P0 | Existing |
| 1.4 | TOKEN_REFRESHED event only updates session, not full profile reload | Source | P0 | Existing |
| 1.5 | Login page does NOT call resetSupabaseClient | Source | P0 | Existing |
| 1.6 | Login page uses router.push (not window.location.href) | Source | P0 | Existing |
| 1.7 | Middleware redirects unauthenticated users to /login | Unit | P0 | Existing |
| 1.8 | Middleware allows public routes without auth | Unit | P0 | Existing |
| 1.9 | Middleware uses getSession() not getUser() for performance | Source | P0 | Existing |
| 1.10 | Password change uses direct REST call (not signInWithPassword) | Source | P1 | New |
| 1.11 | Forgot password API validates email format | Unit | P1 | New |
| 1.12 | /api/auth/me returns current user profile | Unit | P1 | New |
| 1.13 | Signup page validates required fields | Component | P2 | New |
| 1.14 | Role cookie format is "userId:role" with 4-hour maxAge | Source | P1 | New |
| 1.15 | Auth callback route exists at /auth/callback | Source | P1 | New |

---

## Module 2: Multi-Tenant Data Isolation

**BRD Section:** 3.2 (Multi-Tenant Architecture - "Shared database with org_id column")
**Files:**
- All API routes (68 total)
- All server page components (org/* pages)
- `src/lib/analytics/*.ts` (5 files)
- `src/lib/auth/get-department-access.ts`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 2.1 | All org page components fetch org_id from user profile | Source | P0 | Existing |
| 2.2 | Analytics modules filter by org_id in all queries | Source | P0 | Existing |
| 2.3 | Dashboard stats filter by org_id | Source | P0 | Existing |
| 2.4 | getDepartmentAccess parallelizes profile + role queries | Source | P0 | Existing |
| 2.5 | API: /api/applications/* filters by org_id | Source | P0 | New |
| 2.6 | API: /api/notifications/* filters by org_id | Source | P0 | New |
| 2.7 | API: /api/scorecards filters by org_id | Source | P0 | New |
| 2.8 | API: /api/scorecard-templates filters by org_id | Source | P0 | New |
| 2.9 | API: /api/org/ai/* filters by org_id | Source | P0 | New |
| 2.10 | API: /api/org/email/* filters by org_id | Source | P0 | New |
| 2.11 | API: /api/org/integrations/* filters by org_id | Source | P0 | New |
| 2.12 | API: /api/storage/signed-url filters by org_id | Source | P1 | New |
| 2.13 | No API route uses hardcoded org_id values | Source | P0 | New |
| 2.14 | Job-related pages filter by org_id | Source | P0 | New |
| 2.15 | Candidate-related pages filter by org_id | Source | P0 | New |
| 2.16 | Interview pages filter by org_id | Source | P0 | New |
| 2.17 | Offer pages filter by org_id | Source | P0 | New |
| 2.18 | Documents page filters by org_id | Source | P0 | New |
| 2.19 | Team management page filters by org_id | Source | P0 | New |
| 2.20 | Department management page filters by org_id | Source | P0 | New |

---

## Module 3: Role-Based Access Control (RBAC)

**BRD Section:** 2 (User Personas - 6 roles), 3.2 (Architecture)
**Roles:** super_admin, org_admin, hr_manager, recruiter, hiring_manager, interviewer, candidate
**Files:**
- `src/lib/supabase/middleware.ts` (routeRoleMap)
- `src/lib/rbac/rbac-service.ts`
- `src/lib/rbac/types.ts`
- `src/lib/rbac/navigation.ts`
- `src/lib/rbac/index.ts`
- `src/components/rbac/permission-gate.tsx`
- `src/components/rbac/role-based-sidebar.tsx`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 3.1 | super_admin bypasses all route checks | Unit | P0 | Existing |
| 3.2 | org_admin can access /org/settings, /org/team, /org/departments, /org/branding | Unit | P0 | Existing |
| 3.3 | hr_manager can access /org/pipelines, /org/offers/templates, /org/scorecard-templates | Unit | P0 | Existing |
| 3.4 | recruiter can access /org/jobs, /org/candidates, /org/applications | Unit | P0 | Existing |
| 3.5 | hiring_manager can access /org/jobs but NOT /org/settings | Unit | P0 | Existing |
| 3.6 | interviewer can access /org/interviews, /org/scorecards but NOT /org/jobs | Unit | P0 | Existing |
| 3.7 | hiring_manager CANNOT access /org/offers, /org/settings, /org/team | Unit | P0 | Existing |
| 3.8 | recruiter CANNOT access /org/settings, /org/team, /org/departments | Unit | P0 | New |
| 3.9 | interviewer CANNOT access /org/jobs, /org/candidates, /org/offers | Unit | P0 | New |
| 3.10 | RBAC service exports permission checking functions | Source | P1 | New |
| 3.11 | PermissionGate component conditionally renders based on role | Component | P1 | New |
| 3.12 | RoleBasedSidebar shows different navigation per role | Component | P1 | New |
| 3.13 | Navigation config maps roles to menu items | Source | P1 | New |
| 3.14 | Department-scoped access for hiring_manager (departmentIds filtering) | Unit | P0 | New |
| 3.15 | All 7 roles are defined in RBAC types | Source | P1 | New |

---

## Module 4: Job Management

**BRD Section:** 5, Phase 1 (Job Management)
**BRD Schema:** jobs table with org_id, title, title_ar, status, pipeline_id, etc.
**Files:**
- `src/app/(org)/org/jobs/page.tsx`
- `src/app/(org)/org/jobs/[id]/settings/page.tsx`
- `src/app/api/ai/generate-job/route.ts`
- `src/app/api/org/ai/generate-job-description/route.ts`
- `src/app/(org)/org/vacancy-settings/page.tsx` (+ sub-pages)

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 4.1 | Jobs page exists and is accessible | Source | P0 | New |
| 4.2 | Jobs page fetches jobs filtered by org_id | Source | P0 | New |
| 4.3 | Job detail/settings page exists at /org/jobs/[id]/settings | Source | P0 | New |
| 4.4 | AI job generation API validates input | Unit | P1 | New |
| 4.5 | AI job description generation filters by org_id | Source | P1 | New |
| 4.6 | Vacancy settings sub-pages exist (locations, application-form, job-grades, job-types) | Source | P1 | New |
| 4.7 | Job supports bilingual fields (title + title_ar) | Source | P1 | New |
| 4.8 | Job status values match BRD (draft, published, closed, etc.) | Source | P2 | New |
| 4.9 | Jobs support pipeline_id assignment | Source | P1 | New |
| 4.10 | Job auto-close uses org timezone (not UTC) | Source | P0 | New |

---

## Module 5: Candidate Management

**BRD Section:** 5, Phase 1 (Candidate Management)
**BRD Schema:** candidates table with org_id, ai_parsed_data, ai_skills, etc.
**Files:**
- `src/app/(org)/org/candidates/page.tsx`
- `src/app/api/ai/parse-resume/route.ts`
- `src/app/api/ai/score-candidate/route.ts`
- `src/lib/ai/resume-parser.ts`
- `src/lib/ai/candidate-matcher.ts`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 5.1 | Candidates page exists and is accessible | Source | P0 | New |
| 5.2 | Candidates page filters by org_id | Source | P0 | New |
| 5.3 | Resume parser module exists and exports parse function | Source | P1 | New |
| 5.4 | Candidate matcher module exists and exports scoring function | Source | P1 | New |
| 5.5 | Parse resume API validates file input | Unit | P1 | New |
| 5.6 | Score candidate API requires org_id context | Source | P1 | New |
| 5.7 | Candidate supports GDPR consent fields | Source | P2 | New |
| 5.8 | Candidate supports nationality and visa fields (MENA compliance) | Source | P2 | New |

---

## Module 6: Application & Pipeline Management

**BRD Section:** 5, Phase 1 (Pipeline & Application)
**BRD Schema:** applications, pipelines, pipeline_stages tables
**Files:**
- `src/app/(org)/org/applications/page.tsx`
- `src/app/(org)/org/pipelines/page.tsx`
- `src/app/api/applications/bulk/route.ts`
- `src/app/api/applications/[applicationId]/activities/route.ts`
- `src/app/api/applications/[applicationId]/attachments/route.ts`
- `src/app/api/applications/[applicationId]/interviews/route.ts`
- `src/app/api/applications/[applicationId]/notes/route.ts`
- `src/app/api/applications/[applicationId]/scorecards/route.ts`
- `src/app/api/applications/[applicationId]/screening/route.ts`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 6.1 | Applications page exists and filters by org_id | Source | P0 | New |
| 6.2 | Pipelines page exists (hr_manager only) | Source | P0 | New |
| 6.3 | Bulk application API handles batch operations | Source | P1 | New |
| 6.4 | Application activities API records history | Source | P1 | New |
| 6.5 | Application attachments API supports file management | Source | P1 | New |
| 6.6 | Application interviews API links interviews to applications | Source | P1 | New |
| 6.7 | Application notes API supports org_id filtering | Source | P1 | New |
| 6.8 | Application scorecards API links to application | Source | P1 | New |
| 6.9 | Application screening API handles screening questions/answers | Source | P1 | New |
| 6.10 | Screening questions page exists at /org/screening-questions | Source | P1 | New |
| 6.11 | Requisitions page exists at /org/requisitions | Source | P1 | New |

---

## Module 7: Interview & Scorecards

**BRD Section:** 5, Phase 3 (Interview Scheduling)
**BRD Schema:** interviews table with video_meeting_link, video_platform, interviewers, etc.
**Files:**
- `src/app/(org)/org/interviews/page.tsx`
- `src/app/(org)/org/interviews/scorecards/page.tsx`
- `src/app/(org)/org/scorecards/page.tsx`
- `src/app/(org)/org/scorecards/submit/page.tsx`
- `src/app/(org)/org/scorecard-templates/page.tsx`
- `src/app/api/scorecards/route.ts`
- `src/app/api/scorecard-templates/route.ts`
- `src/components/interviews/scorecard-form.tsx`
- `src/components/interviews/feedback-aggregation.tsx`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 7.1 | Interviews page exists and filters by org_id | Source | P0 | New |
| 7.2 | Scorecards page exists at /org/scorecards | Source | P0 | New |
| 7.3 | Scorecard submit page exists at /org/scorecards/submit | Source | P1 | New |
| 7.4 | Scorecard templates page exists (hr_manager only per route map) | Source | P1 | New |
| 7.5 | Scorecards API filters by org_id | Source | P0 | New |
| 7.6 | Scorecard templates API filters by org_id | Source | P0 | New |
| 7.7 | Scorecard form component renders rating inputs | Component | P2 | New |
| 7.8 | Feedback aggregation component compiles interviewer scores | Component | P2 | New |
| 7.9 | Interview supports video_platform field (Zoom, Teams, Meet) | Source | P1 | New |

---

## Module 8: Offers Management

**BRD Section:** 5, Phase 1 (Offer Management)
**Files:**
- `src/app/(org)/org/offers/page.tsx`
- `src/app/(org)/org/offers/templates/page.tsx`
- `src/app/api/offers/respond/route.ts`
- `src/app/offers/respond/page.tsx`
- `src/lib/notifications/send-notification.ts` (processOfferTemplate)

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 8.1 | Offers page exists and filters by org_id | Source | P0 | New |
| 8.2 | Offer templates page exists (hr_manager only) | Source | P0 | New |
| 8.3 | processOfferTemplate accepts responseUrls as optional 4th parameter | Source | P0 | Existing |
| 8.4 | processOfferTemplate replaces all 10 merge fields | Source | P0 | Existing |
| 8.5 | Accept/Decline buttons render when responseUrls provided | Source | P0 | Existing |
| 8.6 | Accept button uses green (#16a34a), Decline uses red (#dc2626) | Source | P0 | Existing |
| 8.7 | Email wraps in responsive HTML layout with DOCTYPE | Source | P0 | Existing |
| 8.8 | Offer respond API validates token | Unit | P0 | New |
| 8.9 | Offer respond API checks token expiry (30-day window) | Unit | P0 | New |
| 8.10 | Offer respond API updates offer status on accept/decline | Unit | P1 | New |
| 8.11 | Offer respond landing page handles loading/success/error states | Component | P1 | New |
| 8.12 | Offer respond routes are in public routes list (no auth required) | Source | P0 | New |
| 8.13 | Token generation uses crypto.randomUUID() | Source | P1 | New |

---

## Module 9: AI/ML Features

**BRD Section:** 7 (AI/ML Specifications), Phase 2
**Files:**
- `src/lib/ai/client.ts`
- `src/lib/ai/unified-client.ts`
- `src/lib/ai/org-ai-config.ts`
- `src/lib/ai/resume-parser.ts`
- `src/lib/ai/candidate-matcher.ts`
- `src/lib/ai/email-generator.ts`
- `src/lib/ai/job-generator.ts`
- `src/app/api/ai/generate-email/route.ts`
- `src/app/api/ai/generate-job/route.ts`
- `src/app/api/ai/parse-resume/route.ts`
- `src/app/api/ai/score-candidate/route.ts`
- `src/app/api/org/ai/*.ts` (10 routes)

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 9.1 | AI client module exports unified client interface | Source | P1 | New |
| 9.2 | Org-level AI config supports per-org API keys/settings | Source | P1 | New |
| 9.3 | Resume parser exports parse function | Source | P1 | New |
| 9.4 | Candidate matcher exports scoring function | Source | P1 | New |
| 9.5 | Email generator exports generate function | Source | P1 | New |
| 9.6 | Job generator exports generate function | Source | P1 | New |
| 9.7 | AI config API (CRUD) filters by org_id | Source | P0 | New |
| 9.8 | AI credentials API encrypts stored keys | Source | P0 | New |
| 9.9 | AI toggle/default APIs require org_id | Source | P1 | New |
| 9.10 | AI rank-applicants API filters by org_id | Source | P0 | New |
| 9.11 | AI screen-candidate API filters by org_id | Source | P0 | New |
| 9.12 | Encryption module exists for API key storage | Source | P1 | New |

---

## Module 10: Email & Notifications

**BRD Section:** 5, Phase 3 (Email Management)
**Files:**
- `src/lib/notifications/send-notification.ts`
- `src/lib/notifications/notification-service.ts`
- `src/lib/notifications/types.ts`
- `src/lib/email/resend.ts`
- `src/lib/email/domain-verification.ts`
- `src/lib/email/providers/*.ts` (5 provider files + types)
- `src/lib/email/imap/*.ts` (2 files)
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/send/route.ts`
- `src/app/api/notifications/test/route.ts`
- `src/app/api/notifications/test-inapp/route.ts`
- `src/app/api/email/track/click/route.ts`
- `src/app/api/email/track/open/route.ts`
- `src/app/api/email/webhooks/route.ts`
- `src/components/notifications/notification-bell.tsx`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 10.1 | Notification service exports send function | Source | P0 | New |
| 10.2 | Notification types define all event types | Source | P1 | New |
| 10.3 | Email provider interface is defined (types.ts) | Source | P1 | New |
| 10.4 | Resend provider implements email interface | Source | P1 | New |
| 10.5 | SendGrid provider implements email interface | Source | P1 | New |
| 10.6 | Mailgun provider implements email interface | Source | P1 | New |
| 10.7 | SMTP provider implements email interface | Source | P1 | New |
| 10.8 | Provider index exports factory/selector function | Source | P1 | New |
| 10.9 | Send notification API filters by org_id | Source | P0 | New |
| 10.10 | Email open tracking API records events | Source | P2 | New |
| 10.11 | Email click tracking API records events | Source | P2 | New |
| 10.12 | Email webhook handler validates payloads | Source | P2 | New |
| 10.13 | IMAP service exists for email receiving | Source | P2 | New |
| 10.14 | Domain verification module exists | Source | P2 | New |
| 10.15 | Notification bell component renders | Component | P2 | New |
| 10.16 | Send notification API generates offer response token on offer type | Source | P0 | New |

---

## Module 11: Integrations

**BRD Section:** 3.1 (External Services), Phase 3
**Files:**
- `src/lib/integrations/*.ts` (6 files)
- `src/lib/google/calendar.ts`
- `src/lib/microsoft/graph.ts`
- `src/lib/zoom/zoom.ts`
- `src/app/api/google/*.ts` (4 routes)
- `src/app/api/microsoft/*.ts` (4 routes)
- `src/app/api/zoom/*.ts` (4 routes)
- `src/app/api/org/integrations/*.ts` (11 routes)
- `src/app/api/integrations/disconnect/route.ts`
- `src/components/integrations/calendar-integration.tsx`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 11.1 | Google calendar module exports calendar functions | Source | P1 | New |
| 11.2 | Microsoft Graph module exports API functions | Source | P1 | New |
| 11.3 | Zoom module exports meeting functions | Source | P1 | New |
| 11.4 | Integration index exports provider registry | Source | P1 | New |
| 11.5 | Google OAuth callback route exists | Source | P1 | New |
| 11.6 | Microsoft OAuth callback route exists | Source | P1 | New |
| 11.7 | Zoom OAuth callback route exists | Source | P1 | New |
| 11.8 | Google meetings API creates video links | Source | P1 | New |
| 11.9 | Microsoft meetings API creates video links | Source | P1 | New |
| 11.10 | Zoom meetings API creates video links | Source | P1 | New |
| 11.11 | Org integrations CRUD APIs filter by org_id | Source | P0 | New |
| 11.12 | Integration credentials are encrypted before storage | Source | P0 | New |
| 11.13 | Disconnect API removes integration for org | Source | P1 | New |
| 11.14 | Calendar integration component renders provider options | Component | P2 | New |
| 11.15 | Org email integration APIs (domain, imap, stats) filter by org_id | Source | P0 | New |

---

## Module 12: Analytics & Dashboards

**BRD Section:** 5, Phase 4 (Analytics Dashboard)
**Files:**
- `src/app/(org)/org/analytics/page.tsx`
- `src/app/(org)/org/page.tsx` (org dashboard)
- `src/lib/analytics/org-admin-stats.ts`
- `src/lib/analytics/dashboard-stats.ts`
- `src/lib/analytics/candidates-list-stats.ts`
- `src/lib/analytics/recruiter-stats.ts`
- `src/lib/analytics/interviewer-stats.ts`
- `src/components/dashboards/org-admin-dashboard.tsx`
- `src/components/dashboards/recruiter-dashboard.tsx`
- `src/components/dashboards/hiring-manager-dashboard.tsx`
- `src/components/dashboards/candidate-dashboard.tsx`
- `src/components/dashboards/super-admin-dashboard.tsx`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 12.1 | Analytics page accessible to org_admin, hr_manager, recruiter, interviewer (not hiring_manager) | Unit | P0 | New |
| 12.2 | Org admin stats module filters all queries by org_id | Source | P0 | Existing |
| 12.3 | Dashboard stats module filters by org_id | Source | P0 | Existing |
| 12.4 | Candidates list stats module filters by org_id | Source | P0 | Existing |
| 12.5 | Recruiter stats module filters by org_id | Source | P0 | Existing |
| 12.6 | Interviewer stats module filters by org_id | Source | P0 | Existing |
| 12.7 | Org admin dashboard component renders stats | Component | P2 | New |
| 12.8 | Recruiter dashboard component renders stats | Component | P2 | New |
| 12.9 | Hiring manager dashboard component renders stats | Component | P2 | New |
| 12.10 | Super admin dashboard exists for platform-level stats | Component | P2 | New |
| 12.11 | Role-specific dashboards show on /org based on user role | Source | P1 | New |

---

## Module 13: Organization Settings & Branding

**BRD Section:** 5, Phase 1 (Organization Setup)
**Files:**
- `src/app/(org)/org/settings/page.tsx`
- `src/app/(org)/org/settings/ai/page.tsx`
- `src/app/(org)/org/settings/email/page.tsx`
- `src/app/(org)/org/settings/integrations/page.tsx`
- `src/app/(org)/org/settings/notifications/page.tsx`
- `src/app/(org)/org/branding/page.tsx`
- `src/app/(org)/org/career-page/page.tsx`
- `src/app/(org)/org/departments/page.tsx`
- `src/app/(org)/org/team/page.tsx`
- `src/app/(org)/org/team/roles/page.tsx`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 13.1 | Settings page is org_admin only | Unit | P0 | Existing |
| 13.2 | Email settings page is org_admin only | Unit | P0 | New |
| 13.3 | Integrations settings page is org_admin only | Unit | P0 | New |
| 13.4 | Notification settings page is hr_manager only | Unit | P0 | New |
| 13.5 | Team page is org_admin only | Unit | P0 | Existing |
| 13.6 | Departments page is org_admin only | Unit | P0 | Existing |
| 13.7 | Branding page is org_admin only | Unit | P0 | New |
| 13.8 | Career page config is org_admin only | Unit | P0 | New |
| 13.9 | AI settings page exists at /org/settings/ai | Source | P1 | New |
| 13.10 | Team roles page exists at /org/team/roles | Source | P1 | New |
| 13.11 | All settings pages filter data by org_id | Source | P0 | New |

---

## Module 14: Career Portal (Public)

**BRD Section:** 5, Phase 1 (Career Portal)
**BRD Requirement:** White-labeled candidate experience, custom domains
**Files:**
- `src/app/careers/[orgSlug]/page.tsx`
- `src/app/careers/[orgSlug]/jobs/[jobId]/page.tsx`
- `src/app/api/careers/apply/route.ts`
- `src/lib/career-page/types.ts`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 14.1 | Career page exists with org slug parameter | Source | P0 | New |
| 14.2 | Individual job page exists with orgSlug and jobId params | Source | P0 | New |
| 14.3 | Apply API handles candidate application submission | Source | P1 | New |
| 14.4 | Career page types define branding/layout configuration | Source | P1 | New |
| 14.5 | Career routes are in public routes list (no auth required) | Source | P0 | New |
| 14.6 | Career page supports Open Graph meta tags for sharing | Source | P1 | New |

---

## Module 15: Candidate Portal

**BRD Section:** 2 (Persona 6 - Candidate), 5
**Files:**
- `src/app/portal/(auth)/login/page.tsx`
- `src/app/portal/(dashboard)/page.tsx`
- `src/app/portal/(dashboard)/applications/page.tsx`
- `src/app/portal/(dashboard)/interviews/page.tsx`
- `src/app/portal/(dashboard)/offers/page.tsx`
- `src/app/portal/(dashboard)/profile/page.tsx`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 15.1 | Portal login page exists at /portal/login | Source | P0 | New |
| 15.2 | Portal dashboard page exists | Source | P0 | New |
| 15.3 | Portal applications page exists | Source | P0 | New |
| 15.4 | Portal interviews page exists | Source | P0 | New |
| 15.5 | Portal offers page exists | Source | P0 | New |
| 15.6 | Portal profile page exists | Source | P0 | New |
| 15.7 | Portal login route is in public routes list | Source | P0 | New |
| 15.8 | Portal auth route is in public routes list | Source | P0 | New |

---

## Module 16: Super Admin Platform

**BRD Section:** 2 (Persona 1 - Super Admin), 5
**Files:**
- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/organizations/page.tsx`
- `src/app/(admin)/users/page.tsx`
- `src/app/(admin)/tiers/page.tsx`
- `src/app/(admin)/billing/page.tsx`
- `src/app/(admin)/audit-logs/page.tsx`
- `src/app/(admin)/settings/page.tsx`
- `src/app/(admin)/candidates/page.tsx`
- `src/app/(admin)/jobs/page.tsx`
- `src/app/api/admin/users/route.ts`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 16.1 | All admin routes require super_admin role | Unit | P0 | New |
| 16.2 | Admin dashboard page exists | Source | P0 | New |
| 16.3 | Organizations management page exists | Source | P0 | New |
| 16.4 | Users management page exists | Source | P0 | New |
| 16.5 | Subscription tiers page exists | Source | P0 | New |
| 16.6 | Billing page exists | Source | P0 | New |
| 16.7 | Audit logs page exists | Source | P0 | New |
| 16.8 | Admin settings page exists | Source | P0 | New |
| 16.9 | Admin candidates view exists (cross-org) | Source | P1 | New |
| 16.10 | Admin jobs view exists (cross-org) | Source | P1 | New |
| 16.11 | Admin users API exists | Source | P1 | New |
| 16.12 | getHomeForRole returns '/admin' for super_admin | Unit | P0 | Existing |
| 16.13 | getHomeForRole returns '/portal' for candidate | Unit | P0 | New |
| 16.14 | getHomeForRole returns '/org' for other roles | Unit | P0 | New |

---

## Module 17: i18n / Arabic (RTL) Support

**BRD Section:** 1.2 (Arabic-First Design), throughout
**Files:**
- `src/lib/i18n/index.ts`
- `src/lib/i18n/server.ts`
- `src/lib/i18n/translations.ts`
- `src/lib/i18n/messages.ts`
- `src/components/i18n/bilingual-input.tsx`
- `src/components/i18n/language-switcher.tsx`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 17.1 | i18n module exports language utilities | Source | P1 | New |
| 17.2 | Translations file contains Arabic (ar) translations | Source | P1 | New |
| 17.3 | Translations file contains English (en) translations | Source | P1 | New |
| 17.4 | Server-side i18n helper exists for RSC | Source | P1 | New |
| 17.5 | BilingualInput component supports dual language input | Component | P2 | New |
| 17.6 | LanguageSwitcher component toggles between ar/en | Component | P2 | New |
| 17.7 | BRD bilingual fields exist: jobs (title/title_ar), orgs (name/name_ar) | Source | P1 | New |

---

## Module 18: Onboarding Flow

**BRD Section:** 2 (Persona 2 - Organization Admin onboarding)
**Files:**
- `src/app/(auth)/onboarding/page.tsx`
- `src/app/api/onboarding-guide/route.ts`
- `src/app/api/onboarding-guide/dismiss/route.ts`
- `src/components/onboarding-guide/onboarding-guide-content.tsx`
- `src/components/onboarding-guide/onboarding-guide-provider.tsx`
- `src/components/onboarding-guide/onboarding-guide-widget.tsx`
- `src/components/onboarding-guide/onboarding-step-item.tsx`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 18.1 | Onboarding page exists at /onboarding | Source | P0 | New |
| 18.2 | Onboarding route is in public routes list (authenticated but no org) | Source | P0 | New |
| 18.3 | Onboarding guide API returns guide steps | Source | P1 | New |
| 18.4 | Onboarding guide dismiss API marks steps complete | Source | P1 | New |
| 18.5 | Onboarding guide provider manages state | Component | P2 | New |
| 18.6 | Onboarding guide widget renders in sidebar/header | Component | P2 | New |

---

## Module 19: Documents & Storage

**BRD Section:** 3.1 (Supabase Storage for CVs, documents)
**Files:**
- `src/app/(org)/org/documents/page.tsx`
- `src/app/api/storage/signed-url/route.ts`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 19.1 | Documents page exists (hr_manager, recruiter only) | Source | P0 | New |
| 19.2 | Documents route restricted per route-role map | Unit | P0 | New |
| 19.3 | Signed URL API generates secure download links | Source | P1 | New |
| 19.4 | Signed URL API filters by org_id | Source | P0 | New |

---

## Module 20: Workflow Engine

**Files:**
- `src/lib/workflows/workflow-engine.ts`

### Test Cases

| # | Test Case | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 20.1 | Workflow engine module exists and exports engine functions | Source | P1 | New |
| 20.2 | Workflow engine supports pipeline stage transitions | Source | P1 | New |
| 20.3 | Workflow engine triggers notifications on stage change | Source | P2 | New |

---

## BRD Compliance Matrix

This maps each BRD section to implemented features:

| BRD Section | Requirement | Implemented? | Test Module |
|------------|-------------|--------------|-------------|
| 1.1 | Multi-tenant SaaS | Verify | Module 2 |
| 1.1 | 99.9% uptime | N/A (infra) | - |
| 1.2 | Recruiter: AI-powered ranking | Verify | Module 9 |
| 1.2 | HR Manager: Configurable pipelines | Verify | Module 6 |
| 1.2 | Candidate: 5-min application | Verify | Module 14 |
| 1.2 | Super Admin: Central control | Verify | Module 16 |
| 2 | 6 user personas/roles | Verify | Module 3 |
| 3.1 | Next.js + Supabase + Resend | Verify | BRD compliance |
| 3.1 | Arabic RTL support | Verify | Module 17 |
| 3.1 | React Hook Form + Zod | Verify | BRD compliance |
| 3.2 | Shared DB with org_id RLS | Verify | Module 2 |
| 4.1 | Organizations table schema | Verify | BRD compliance |
| 4.1 | Subscription tiers table | Verify | Module 16 |
| 4.1 | Users table with roles | Verify | Module 3 |
| 4.1 | Jobs table with bilingual fields | Verify | Module 4 |
| 4.1 | Candidates table with AI fields | Verify | Module 5 |
| 4.1 | Applications table with pipeline | Verify | Module 6 |
| 4.1 | Pipelines & stages tables | Verify | Module 6 |
| 4.1 | Interviews table with video fields | Verify | Module 7 |
| Phase 1 | Auth & multi-tenancy | Verify | Modules 1-3 |
| Phase 1 | Job & application management | Verify | Modules 4, 6 |
| Phase 1 | Candidate management & pipeline | Verify | Modules 5, 6 |
| Phase 2 | AI integration | Verify | Module 9 |
| Phase 2 | Resume parsing | Verify | Module 9 |
| Phase 2 | Candidate scoring | Verify | Module 9 |
| Phase 2 | Arabic language support | Verify | Module 17 |
| Phase 3 | Email management | Verify | Module 10 |
| Phase 3 | Interview scheduling | Verify | Module 7 |
| Phase 3 | Calendar integration | Verify | Module 11 |
| Phase 4 | Analytics dashboard | Verify | Module 12 |
| Phase 5 | Performance optimization | Verify | Module 1 |

---

## Existing Tests Status

Tests already written (from previous session):

| File | Test Count | Status |
|------|-----------|--------|
| `tests/brd/brd-compliance.test.ts` | ~30 | Written, needs verification |
| `tests/unit/middleware.test.ts` | ~15 | Written, needs verification |
| `tests/unit/multi-tenant.test.ts` | ~10 | Written, needs verification |
| `tests/unit/auth-context.test.ts` | ~12 | Written, needs verification |
| `tests/unit/offer-template.test.ts` | ~8 | Written, needs verification |

**Total existing: ~75 test cases**
**Total in this plan: ~210 test cases**
**New tests needed: ~135 test cases**

---

## Priority & Implementation Order

### Phase A: Critical Security (P0) — Implement First
1. **Multi-tenant isolation** (Module 2) — All API routes verify org_id filtering
2. **RBAC enforcement** (Module 3) — All role-based route restrictions
3. **Auth correctness** (Module 1) — Session handling, token management

### Phase B: Core Business Logic (P0-P1)
4. **Offer flow** (Module 8) — Token generation, accept/decline, email buttons
5. **Application pipeline** (Module 6) — CRUD, stage transitions, bulk operations
6. **Job management** (Module 4) — Job CRUD, auto-close, bilingual support
7. **Interview & scorecards** (Module 7) — Scheduling, scoring, feedback

### Phase C: Platform Features (P1)
8. **AI/ML features** (Module 9) — Resume parsing, scoring, org-level config
9. **Notifications** (Module 10) — Email providers, send flow, tracking
10. **Integrations** (Module 11) — OAuth callbacks, meeting creation
11. **Super admin** (Module 16) — Platform management routes
12. **Analytics** (Module 12) — Org-scoped stats modules

### Phase D: UI & UX (P1-P2)
13. **Career portal** (Module 14) — Public job listings, application
14. **Candidate portal** (Module 15) — Dashboard, applications, interviews
15. **Onboarding** (Module 18) — Guide flow, step tracking
16. **i18n** (Module 17) — Translation coverage, bilingual components
17. **Documents & storage** (Module 19) — File management, signed URLs
18. **Workflow engine** (Module 20) — Stage transitions, automation

### Phase E: Component Tests (P2)
19. **Dashboard components** (Module 12) — Render tests
20. **Form components** (Modules 7, 17) — Scorecard, bilingual input
21. **Navigation components** (Module 3) — Sidebar, permission gate

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total modules | 20 |
| Total test cases | ~210 |
| P0 (Critical) | ~85 |
| P1 (Important) | ~80 |
| P2 (Nice-to-have) | ~45 |
| Already written | ~75 |
| New to implement | ~135 |
| Pages covered | 55 / 55 |
| API routes covered | 68 / 68 |
| Lib modules covered | 60 / 60 |
