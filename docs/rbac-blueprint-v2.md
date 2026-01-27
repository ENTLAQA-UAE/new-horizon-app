# Middleware & Role-Based Access Control — REVISED Blueprint v2

> **Status:** Awaiting final approval before implementation **Revision:** Incorporates user feedback — org_admin is org-settings-only, removed from approval cycles, hr_manager owns notification settings, hiring_manager is department-scoped

---

## 1. Role Definitions (Revised)

### 1.1 super_admin — Platform Owner

| **Aspect**        | **Detail**                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Purpose**       | Manages the SaaS platform itself. Operates ABOVE organizations.                          |
| **Who**           | Platform engineering/ops team (Jadarat staff)                                            |
| **Can See**       | All organizations, all users, subscription tiers, billing, platform settings, audit logs |
| **Can Do**        | Create/suspend orgs, manage subscriptions, impersonate for support, configure platform   |
| **Cannot Do**     | Org-level or ATS operations. Must impersonate if support is needed.                      |
| **Approval**      | N/A — platform-level actions only, not part of any org approval cycle                    |
| **Notifications** | Platform alerts only (new org signup, subscription changes, system errors)               |

**Sidebar:**

- Dashboard
- Organizations
- Users
- Subscription Tiers
- Billing & Payments
- Audit Logs
- Platform Settings

---

### 1.2 org_admin — Organization Administrator

| **Aspect**        | **Detail**                                                                                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**       | Manages organization configuration, infrastructure, and team. **NOT involved in HR/ATS operations.**                                                                                                                                         |
| **Who**           | CEO, COO, IT Director, or designated organization owner                                                                                                                                                                                      |
| **Can See**       | Organization settings, team members, departments, branding, career page, video/email integration config, analytics dashboard (org-level KPIs only)                                                                                           |
| **Can Do**        | Manage team members (invite, remove, assign roles), manage departments, configure branding, manage career page, configure general settings, set up video integration, set up email provider (SMTP/Resend/SendGrid), view org-level dashboard |
| **Cannot Do**     | Any ATS operations (jobs, candidates, applications, interviews, offers, requisitions). Cannot manage notification settings (that's hr_manager). Not part of any approval cycle.                                                              |
| **Approval**      | **NOT in any approval cycle.** Cannot approve jobs, requisitions, or offers.                                                                                                                                                                 |
| **Notifications** | Team changes only (user joined, role changed). No ATS notifications.                                                                                                                                                                         |

**Sidebar:**

- Dashboard
- Analytics (org-level)
- **Organization:**
    - Team Members
    - Departments
    - Branding
    - Career Page
- **Settings:**
    - General Settings
    - Video Integration
    - Email Integration

---

### 1.3 hr_manager — HR Operations Manager

| **Aspect**        | **Detail**                                                                                                                                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**       | Owns the entire ATS and hiring operations. Top authority for all HR decisions. Manages configuration, templates, workflows, and notification settings.                                                                                                                                                                  |
| **Who**           | HR Manager, HR Director, Talent Acquisition Lead                                                                                                                                                                                                                                                                        |
| **Can See**       | All ATS data (all jobs, all candidates, all applications, all interviews, all offers, all requisitions), analytics, all templates, pipelines, vacancy settings, notification settings                                                                                                                                   |
| **Can Do**        | Create/edit/delete jobs, publish jobs directly, manage candidates, schedule interviews, create/approve/send offers, approve requisitions, manage templates (offer, scorecard), manage pipelines, screening questions, vacancy settings, documents, bulk operations, configure notification settings and email templates |
| **Cannot Do**     | Organization infrastructure (branding, team management, video/email provider config, departments, career page). Those belong to org_admin.                                                                                                                                                                              |
| **Approval**      | **TOP APPROVER for all HR workflows.** Approves job publishing (from recruiters), approves requisitions (from hiring managers and recruiters), approves and sends offers (from recruiters). Can self-approve all actions.                                                                                               |
| **Notifications** | All ATS events: new applications, stage changes, interview updates, scorecard submissions, offer responses, requisition requests, job status changes                                                                                                                                                                    |

**Sidebar:**

- Dashboard
- Analytics (ATS)
- **Hiring:**
    - Jobs
    - Candidates
    - Applications
    - Interviews
    - Scorecards
    - Offers
    - Requisitions
- **Configuration:**
    - Offer Templates
    - Scorecard Templates
    - Pipelines
    - Screening Questions
    - Vacancy Settings
    - Documents
    - Notification Settings *(moved from org_admin)*

---

### 1.4 recruiter — Recruiter

| **Aspect**        | **Detail**                                                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**       | Handles day-to-day sourcing, screening, and candidate management.                                                                                                            |
| **Who**           | Recruiter, Talent Acquisition Specialist                                                                                                                                     |
| **Can See**       | All jobs, all candidates, all applications, interviews, offers they created, documents                                                                                       |
| **Can Do**        | Create jobs (draft), source and add candidates, move candidates through pipeline stages, schedule interviews, create offers (draft), manage documents, reject candidates     |
| **Cannot Do**     | Publish jobs (needs hr_manager approval), send offers (needs hr_manager approval), manage templates/pipelines/vacancy settings, access org settings or notification settings |
| **Approval**      | **Requires hr_manager approval for:** Publishing jobs, Sending offers.                                                                                                       |
| **Notifications** | New applications, interview reminders, offer responses, stage changes                                                                                                        |

**Sidebar:**

- Dashboard
- **Hiring:**
    - Jobs
    - Candidates
    - Applications
    - Interviews
    - Offers
- **Tools:**
    - Documents

---

### 1.5 hiring_manager — Hiring Manager / Department Manager

| **Aspect**        | **Detail**                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**       | Department head who participates in hiring for their team. **Linked to a specific department.** Can only see and interact with hiring related to their department.                                                                          |
| **Who**           | Engineering Manager, Sales Director, Department Head                                                                                                                                                                                        |
| **Can See**       | Jobs for their department, candidates who applied to their department's jobs, applications for their department, interviews for their department (especially those they attend), scorecards for their department, requisitions they created |
| **Can Do**        | Create requisitions for their department (needs hr_manager approval), attend interviews, submit scorecards, view the full hiring cycle for their department                                                                                 |
| **Cannot Do**     | Create jobs (uses requisitions), create offers, move candidates between stages, schedule interviews, manage templates/pipelines/settings, see other departments' hiring data                                                                |
| **Approval**      | **Requires hr_manager approval for:** Requisitions. **No approval authority** — cannot approve anything.                                                                                                                                    |
| **Notifications** | New candidates for their department, interview reminders (their own), scorecard reminders, requisition status (approved/rejected), offer status for department positions                                                                    |

**Sidebar:**

- Dashboard
- **My Department Hiring:**
    - Requisitions
    - Candidates *(filtered to department)*
    - Applications *(filtered to department)*
    - Interviews *(filtered to department/assigned)*
    - Scorecards

---

### 1.6 interviewer — Interviewer

| **Aspect**        | **Detail**                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**       | Participates in interviews and provides evaluation feedback.                                                                      |
| **Who**           | Any team member assigned to interview a candidate                                                                                 |
| **Can See**       | Interviews assigned to them, full candidate details (name, email, phone, resume, cover letter), their own scorecards              |
| **Can Do**        | Submit scorecards for their interviews, view interview schedule, add interview notes                                              |
| **Cannot Do**     | View other interviewers' scorecards, move candidates, create/edit jobs, create offers, access any settings or management features |
| **Approval**      | None — no approval authority or requirements                                                                                      |
| **Notifications** | Interview scheduled/cancelled/rescheduled (their own), scorecard reminders                                                        |

**Sidebar:**

- Dashboard
- **My Interviews:**
    - Interviews
    - Scorecards

---

### 1.7 candidate — External Candidate

| **Aspect**        | **Detail**                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Purpose**       | Job applicant interacting through the candidate portal.                                                           |
| **Who**           | External candidates who applied for jobs                                                                          |
| **Can See**       | Own applications, own interviews, own offers, own profile, own documents                                          |
| **Can Do**        | Apply for jobs (via career page), accept/reject offers, manage profile, upload documents, view interview schedule |
| **Cannot Do**     | Access any org-level features. Portal-only.                                                                       |
| **Notifications** | Application confirmation, interview scheduling, offer received                                                    |

**Sidebar (Portal):**

- Dashboard
- Applications
- Interviews
- Offers
- Profile
- Documents

---

## 2. Approval Workflows (Revised — org_admin EXCLUDED)

### 2.1 Job Publishing Approval

```other
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  Recruiter   │────→│  hr_manager  │────→│  Published  │
│ creates job  │     │   approves   │     │            │
│  (draft)     │     │              │     │            │
└─────────────┘     └──────────────┘     └────────────┘

┌──────────────┐     ┌────────────┐
│  hr_manager  │────→│  Published  │  (direct publish — no approval needed)
│  creates job │     │            │
└──────────────┘     └────────────┘
```

| **Role**       | **Can Create Draft**   | **Can Publish Directly** | **Needs Approval From** |
| -------------- | ---------------------- | ------------------------ | ----------------------- |
| hr_manager     | Yes                    | Yes (direct)             | —                       |
| recruiter      | Yes                    | No                       | hr_manager              |
| hiring_manager | No (uses requisitions) | No                       | N/A                     |
| org_admin      | No                     | No                       | N/A — not involved      |

### 2.2 Requisition Approval

```other
┌──────────────┐     ┌──────────────┐     ┌────────────┐
│hiring_manager│────→│  hr_manager  │────→│  Approved  │
│  requests    │     │   approves   │     │            │
│ (for dept)   │     │              │     │            │
└──────────────┘     └──────────────┘     └────────────┘

┌──────────────┐     ┌──────────────┐     ┌────────────┐
│  recruiter   │────→│  hr_manager  │────→│  Approved  │
│   creates    │     │   approves   │     │            │
└──────────────┘     └──────────────┘     └────────────┘

┌──────────────┐     ┌────────────┐
│  hr_manager  │────→│  Approved  │  (direct approve — no chain needed)
│   creates    │     │            │
└──────────────┘     └────────────┘
```

| **Role**       | **Can Create**  | **Can Approve** | **Needs Approval From** |
| -------------- | --------------- | --------------- | ----------------------- |
| hr_manager     | Yes             | Yes (direct)    | —                       |
| recruiter      | Yes             | No              | hr_manager              |
| hiring_manager | Yes (dept only) | No              | hr_manager              |
| org_admin      | No              | No              | N/A — not involved      |

### 2.3 Offer Approval

```other
┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  recruiter   │────→│  hr_manager  │────→│  Sent to  │
│ creates offer│     │   approves   │     │ candidate │
└──────────────┘     └──────────────┘     └──────────┘

┌──────────────┐     ┌──────────┐
│  hr_manager  │────→│  Sent to  │  (direct approve + send)
│ creates offer│     │ candidate │
└──────────────┘     └──────────┘
```

| **Role**       | **Can Create** | **Can Approve** | **Can Send** | **Needs Approval From** |
| -------------- | -------------- | --------------- | ------------ | ----------------------- |
| hr_manager     | Yes            | Yes             | Yes (direct) | —                       |
| recruiter      | Yes            | No              | No           | hr_manager              |
| hiring_manager | No             | No              | No           | N/A — view only         |
| org_admin      | No             | No              | No           | N/A — not involved      |

### 2.4 Candidate Rejection

| **Role**       | **Can Reject** | **Scope**          |
| -------------- | -------------- | ------------------ |
| hr_manager     | Yes            | All candidates     |
| recruiter      | Yes            | All candidates     |
| hiring_manager | No             | View only (dept)   |
| org_admin      | No             | N/A — not involved |
| interviewer    | No             | Cannot reject      |

Rejection reason is mandatory and logged.

---

## 3. Middleware Route Protection (Revised)

### 3.1 Route-Role Map

```other
Request → Middleware
            │
            ├── Static/Internal files → PASS
            │
            ├── Public routes → PASS
            │   (/login, /signup, /careers, /portal/login, /api/careers, /api/invites, etc.)
            │
            ├── Auth check → No user? → REDIRECT /login
            │
            ├── Role lookup (from cookie cache or fast DB query)
            │
            ├── Route-role enforcement:
            │
            │   ── PLATFORM (super_admin ONLY) ──
            │   /admin/*           → super_admin
            │   /organizations     → super_admin
            │   /users             → super_admin
            │   /tiers             → super_admin
            │   /billing           → super_admin
            │   /audit-logs        → super_admin
            │   /settings          → super_admin (platform settings)
            │
            │   ── ORG ADMIN ONLY ──
            │   /org/team/*        → org_admin
            │   /org/departments   → org_admin
            │   /org/branding      → org_admin
            │   /org/career-page   → org_admin
            │   /org/settings      → org_admin (general settings)
            │   /org/settings/integrations → org_admin (video integration)
            │   /org/settings/email → org_admin (email provider config)
            │
            │   ── HR MANAGER ONLY ──
            │   /org/settings/notifications → hr_manager
            │   /org/pipelines              → hr_manager
            │   /org/offers/templates       → hr_manager
            │   /org/scorecard-templates    → hr_manager
            │   /org/screening-questions    → hr_manager
            │   /org/vacancy-settings/*     → hr_manager
            │
            │   ── ANALYTICS ──
            │   /org/analytics     → org_admin, hr_manager
            │
            │   ── ATS CORE (hr_manager + recruiter + hiring_manager filtered) ──
            │   /org/jobs/*              → hr_manager, recruiter, hiring_manager(dept)
            │   /org/candidates/*        → hr_manager, recruiter, hiring_manager(dept)
            │   /org/applications/*      → hr_manager, recruiter, hiring_manager(dept)
            │   /org/requisitions        → hr_manager, recruiter, hiring_manager
            │   /org/offers/*            → hr_manager, recruiter
            │
            │   ── INTERVIEWS (widest access) ──
            │   /org/interviews/*        → hr_manager, recruiter, hiring_manager(dept), interviewer(assigned)
            │   /org/scorecards/*        → hr_manager, recruiter, hiring_manager(dept), interviewer(own)
            │
            │   ── DOCUMENTS ──
            │   /org/documents           → hr_manager, recruiter
            │
            │   ── DASHBOARD (all org roles) ──
            │   /org                     → org_admin, hr_manager, recruiter, hiring_manager, interviewer
            │
            │   ── CANDIDATE PORTAL ──
            │   /portal/*               → candidate (portal auth)
            │
            └── PASS with role header
```

### 3.2 Performance: Role Cookie

To avoid DB queries on every request:

1. **On login:** Set HTTP-only cookie `x-user-role` with the user's primary role
2. **In middleware:** Read role from cookie (zero DB queries)
3. **On role change:** Role assignment API refreshes the cookie
4. **Fallback:** If cookie missing, query DB once and set cookie

---

## 4. API Route Protection (Revised)

| **API Route**                           | **Allowed Roles**                                             | **Notes**                            |
| --------------------------------------- | ------------------------------------------------------------- | ------------------------------------ |
| `POST /api/notifications/send`          | hr_manager, recruiter, hiring_manager                         | ATS notifications only               |
| `GET /api/notifications`                | ALL authenticated                                             | Returns own notifications            |
| `POST /api/notifications/test`          | hr_manager                                                    | Notification testing (was org_admin) |
| `POST /api/applications/bulk`           | hr_manager, recruiter                                         | Bulk stage move/reject               |
| `GET /api/applications/[id]/scorecards` | hr_manager, recruiter, hiring_manager(dept), interviewer(own) | Add role check (currently missing)   |
| `GET /api/applications/[id]/screening`  | hr_manager, recruiter                                         | Screening responses                  |
| `POST /api/careers/apply`               | PUBLIC                                                        | Career page submission               |
| `POST /api/org/email/*`                 | org_admin                                                     | Email provider config                |
| `POST /api/org/integrations/*`          | org_admin                                                     | Integration settings                 |
| `POST /api/invites/accept`              | PUBLIC                                                        | Accept invitation                    |
| `POST /api/org/team/*`                  | org_admin                                                     | Team management                      |

---

## 5. Data Visibility Matrix (Revised)

### 5.1 Candidate Data

| **Data Field**      | **hr_manager** | **recruiter** | **hiring_manager** | **interviewer** |
| ------------------- | -------------- | ------------- | ------------------ | --------------- |
| Full name           | All            | All           | Dept only          | Assigned only   |
| Email               | All            | All           | Dept only          | Assigned only   |
| Phone               | All            | All           | Dept only          | Assigned only   |
| Resume/CV           | All            | All           | Dept only          | Assigned only   |
| Cover letter        | All            | All           | Dept only          | Assigned only   |
| Application form    | All            | All           | Dept only          | No              |
| Screening answers   | All            | All           | No                 | No              |
| All scorecards      | All            | All           | Dept only          | Own only        |
| Salary expectations | All            | All           | No                 | No              |
| Offer details       | All            | All           | Dept only (view)   | No              |
| Rejection reasons   | All            | All           | Dept only          | No              |
| Activity log        | All            | All           | Dept only          | No              |

**org_admin sees NONE of this data** — they manage org settings only.

### 5.2 Job Data

| **Data Field**    | **hr_manager** | **recruiter** | **hiring_manager** | **interviewer** |
| ----------------- | -------------- | ------------- | ------------------ | --------------- |
| All jobs          | All            | All           | Dept only          | No              |
| Job settings      | All            | All           | Dept only (read)   | No              |
| Pipeline config   | All (manage)   | Read only     | No                 | No              |
| Application stats | All            | All           | Dept only          | No              |

---

## 6. Notification Routing by Role (Revised)

| **Event**            | **org_admin** | **hr_manager** | **recruiter**  | **hiring_manager** | **interviewer** | **candidate** |
| -------------------- | ------------- | -------------- | -------------- | ------------------ | --------------- | ------------- |
| New application      | —             | In-app + Email | In-app + Email | In-app (dept)      | —               | Email         |
| Stage moved          | —             | In-app         | In-app         | In-app (dept)      | —               | Email         |
| Interview scheduled  | —             | In-app         | In-app         | In-app (dept)      | In-app + Email  | Email         |
| Interview cancelled  | —             | In-app         | In-app         | In-app (dept)      | In-app + Email  | Email         |
| Interview reminder   | —             | —              | —              | In-app (assigned)  | In-app + Email  | Email         |
| Scorecard submitted  | —             | In-app         | In-app         | In-app (dept)      | —               | —             |
| Scorecard reminder   | —             | —              | —              | —                  | In-app + Email  | —             |
| Offer created        | —             | In-app         | In-app         | In-app (dept)      | —               | —             |
| Offer sent           | —             | In-app         | In-app         | In-app (dept)      | —               | Email         |
| Offer accepted       | —             | In-app + Email | In-app         | In-app (dept)      | —               | Email         |
| Offer rejected       | —             | In-app + Email | In-app         | In-app (dept)      | —               | Email         |
| Requisition created  | —             | In-app + Email | —              | —                  | —               | —             |
| Requisition approved | —             | In-app         | —              | In-app + Email     | —               | —             |
| Requisition rejected | —             | —              | —              | In-app + Email     | —               | —             |
| Job published        | —             | In-app         | In-app         | In-app (dept)      | —               | —             |
| Job closed           | —             | In-app         | In-app         | In-app (dept)      | —               | —             |
| User joined          | In-app        | —              | —              | —                  | —               | —             |
| Role changed         | In-app        | —              | —              | —                  | —               | —             |

**org_admin** receives ONLY team-related notifications (user joined, role changed). **"(dept)"** = Only if event relates to their department's jobs. **"(assigned)"** = Only if they're assigned to that specific interview.

---

## 7. Approval Bypass Summary (Revised)

| **Action**          | **hr_manager** | **recruiter**    | **hiring_manager** | **org_admin** |
| ------------------- | -------------- | ---------------- | ------------------ | ------------- |
| Publish job         | **DIRECT**     | Needs hr_manager | Cannot             | Not involved  |
| Approve requisition | **DIRECT**     | Needs hr_manager | Needs hr_manager   | Not involved  |
| Approve offer       | **DIRECT**     | Needs hr_manager | Cannot (view only) | Not involved  |
| Send offer          | **DIRECT**     | Needs hr_manager | Cannot             | Not involved  |
| Reject candidate    | Direct         | Direct           | Cannot (view only) | Not involved  |
| Move pipeline stage | Direct         | Direct           | Cannot             | Not involved  |
| Schedule interview  | Direct         | Direct           | Cannot             | Not involved  |
| Cancel interview    | Direct         | Direct           | Cannot             | Not involved  |

**hr_manager is the sole approver.** org_admin is completely excluded from all ATS workflows.

---

## 8. Changes vs Current System (Summary)

| **Area**               | **Current**                           | **Proposed**                                                    |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------- |
| **Middleware**         | Auth-only (no role checks)            | Auth + role-based route enforcement                             |
| **org_admin**          | Has ATS sidebar items + some ATS read | Org settings ONLY, zero ATS access, excluded from all approvals |
| **hr_manager**         | No notification settings              | Gets notification settings (moved from org_admin)               |
| **hr_manager**         | Shares approval with org_admin        | **Sole approver** for all ATS workflows                         |
| **hiring_manager**     | Can see all candidates                | **Department-scoped only**, linked to their department          |
| **Recruiter jobs**     | Can publish freely                    | Needs hr_manager approval to publish                            |
| **Recruiter offers**   | Can send freely                       | Needs hr_manager approval to send                               |
| **interviewer**        | Contact info unclear                  | Full candidate details visible (confirmed)                      |
| **API routes**         | Inconsistent role checks              | Standard `verifyAccess()` on all routes                         |
| **Role in middleware** | Not cached                            | HTTP-only cookie for zero-latency                               |

---

## 9. Department Linking for Hiring Manager

The hiring_manager must be linked to a specific department. This requires:

1. **Database:** `user_roles` table or `profiles` table needs a `department_id` column for hiring_manager users
2. **Assignment:** When org_admin assigns hiring_manager role, they also select the department
3. **Query Filtering:** All ATS queries for hiring_manager filter by `department_id` matching the job's department
4. **Multi-department:** A hiring_manager can potentially manage multiple departments (array of department IDs)

---

## 10. Implementation Phases (if approved)

**Phase 1 — Middleware Enhancement**

- Add role-based route map to middleware
- Implement role cookie (set on login, refresh on role change)
- Create `verifyAccess()` API helper

**Phase 2 — Role Sidebar Restructure**

- Revise org_admin sidebar (remove all ATS items)
- Add notification settings to hr_manager sidebar
- Add department filter label to hiring_manager sidebar

**Phase 3 — Approval Workflows**

- Add job status: draft → pending_approval → published
- Add offer status: draft → pending_approval → approved → sent
- Remove org_admin from all approval chains
- Add approval notification triggers (hr_manager receives approval requests)

**Phase 4 — Department Scoping**

- Add `department_id` to hiring_manager role assignment
- Filter all ATS queries for hiring_manager by department
- Scope hiring_manager notifications to department events only

**Phase 5 — API Hardening**

- Apply `verifyAccess()` to all API routes
- Fix identified gaps (scorecards, bulk operations)
- Move notification test from org_admin to hr_manager

**Phase 6 — Notification Routing**

- Remove org_admin from ATS notification recipients
- Add department scoping for hiring_manager notifications
- Ensure hr_manager receives all approval request notifications
