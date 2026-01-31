/**
 * BRD Compliance Tests
 *
 * Maps each BRD requirement to actual codebase implementation.
 * Verifies that required modules, routes, and features exist.
 */
import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const SRC = path.resolve(__dirname, "../../src")
const APP = path.join(SRC, "app")
const LIB = path.join(SRC, "lib")

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(SRC, "..", relativePath))
}

function dirExists(relativePath: string): boolean {
  const full = path.join(SRC, "..", relativePath)
  return fs.existsSync(full) && fs.statSync(full).isDirectory()
}

function srcFileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(SRC, relativePath))
}

// ============================================================
// BRD Section 1: Product Vision & Goals
// ============================================================
describe("BRD 1 - Product Vision & Goals", () => {
  it("should be a Next.js application", () => {
    expect(fileExists("next.config.ts") || fileExists("next.config.js") || fileExists("next.config.mjs")).toBe(true)
  })

  it("should use Supabase as database layer", () => {
    expect(srcFileExists("lib/supabase/client.ts")).toBe(true)
    expect(srcFileExists("lib/supabase/server.ts")).toBe(true)
    expect(srcFileExists("lib/supabase/service.ts")).toBe(true)
  })

  it("should have multi-tenant architecture with org_id isolation", () => {
    expect(srcFileExists("lib/supabase/middleware.ts")).toBe(true)
  })

  it("should support Arabic and English (i18n)", () => {
    expect(dirExists("src/messages/ar") || fileExists("src/messages/ar.json") || srcFileExists("lib/i18n/index.ts")).toBe(true)
  })
})

// ============================================================
// BRD Section 2: User Personas (Routes Exist)
// ============================================================
describe("BRD 2 - User Personas & Roles", () => {
  describe("Persona 1: Super Admin", () => {
    it("should have admin dashboard", () => {
      expect(dirExists("src/app/(admin)/admin")).toBe(true)
    })

    it("should have organization management", () => {
      expect(dirExists("src/app/(admin)/organizations")).toBe(true)
    })

    it("should have subscription tier management", () => {
      expect(dirExists("src/app/(admin)/tiers")).toBe(true)
    })

    it("should have billing management", () => {
      expect(dirExists("src/app/(admin)/billing")).toBe(true)
    })

    it("should have user management", () => {
      expect(dirExists("src/app/(admin)/users")).toBe(true)
    })

    it("should have audit logs", () => {
      expect(dirExists("src/app/(admin)/audit-logs")).toBe(true)
    })
  })

  describe("Persona 2: Organization Admin", () => {
    it("should have org dashboard", () => {
      expect(srcFileExists("app/(org)/org/page.tsx")).toBe(true)
    })

    it("should have team management", () => {
      expect(dirExists("src/app/(org)/org/team")).toBe(true)
    })

    it("should have branding configuration", () => {
      expect(dirExists("src/app/(org)/org/branding")).toBe(true)
    })

    it("should have department management", () => {
      expect(dirExists("src/app/(org)/org/departments")).toBe(true)
    })

    it("should have career page configuration", () => {
      expect(dirExists("src/app/(org)/org/career-page")).toBe(true)
    })

    it("should have settings hub", () => {
      expect(dirExists("src/app/(org)/org/settings")).toBe(true)
    })
  })

  describe("Persona 3: HR Manager", () => {
    it("should have pipeline configuration", () => {
      expect(dirExists("src/app/(org)/org/pipelines")).toBe(true)
    })

    it("should have offer template management", () => {
      expect(dirExists("src/app/(org)/org/offers")).toBe(true)
    })

    it("should have screening question management", () => {
      expect(dirExists("src/app/(org)/org/screening-questions")).toBe(true)
    })

    it("should have scorecard template management", () => {
      expect(dirExists("src/app/(org)/org/scorecard-templates")).toBe(true)
    })

    it("should have analytics access", () => {
      expect(dirExists("src/app/(org)/org/analytics")).toBe(true)
    })
  })

  describe("Persona 4: Recruiter", () => {
    it("should have job management", () => {
      expect(dirExists("src/app/(org)/org/jobs")).toBe(true)
    })

    it("should have candidate management", () => {
      expect(dirExists("src/app/(org)/org/candidates")).toBe(true)
    })

    it("should have application management", () => {
      expect(dirExists("src/app/(org)/org/applications")).toBe(true)
    })

    it("should have interview management", () => {
      expect(dirExists("src/app/(org)/org/interviews")).toBe(true)
    })

    it("should have offer management", () => {
      expect(dirExists("src/app/(org)/org/offers")).toBe(true)
    })
  })

  describe("Persona 5: Hiring Manager", () => {
    it("should have interview scorecards", () => {
      expect(dirExists("src/app/(org)/org/scorecards")).toBe(true)
    })

    it("should have requisition management", () => {
      expect(dirExists("src/app/(org)/org/requisitions")).toBe(true)
    })
  })

  describe("Persona 6: Job Candidate", () => {
    it("should have public career page", () => {
      expect(dirExists("src/app/careers")).toBe(true)
    })

    it("should have candidate portal", () => {
      expect(dirExists("src/app/portal")).toBe(true)
    })

    it("should have portal applications view", () => {
      expect(srcFileExists("app/portal/(dashboard)/applications/page.tsx")).toBe(true)
    })

    it("should have portal interviews view", () => {
      expect(srcFileExists("app/portal/(dashboard)/interviews/page.tsx")).toBe(true)
    })

    it("should have portal offers view", () => {
      expect(srcFileExists("app/portal/(dashboard)/offers/page.tsx")).toBe(true)
    })
  })
})

// ============================================================
// BRD Section 3: Technical Architecture
// ============================================================
describe("BRD 3 - Technical Architecture", () => {
  it("should use Next.js App Router", () => {
    expect(dirExists("src/app")).toBe(true)
  })

  it("should use Tailwind CSS", () => {
    expect(fileExists("tailwind.config.ts") || fileExists("tailwind.config.js") || fileExists("postcss.config.mjs")).toBe(true)
  })

  it("should use Supabase Auth (JWT-based)", () => {
    expect(srcFileExists("lib/supabase/middleware.ts")).toBe(true)
    expect(srcFileExists("lib/auth/auth-context.tsx")).toBe(true)
  })

  it("should have Row-Level Security middleware", () => {
    expect(srcFileExists("lib/supabase/middleware.ts")).toBe(true)
  })

  it("should have Sentry for error tracking", () => {
    expect(srcFileExists("lib/sentry.ts") || fileExists("sentry.client.config.ts") || fileExists("sentry.server.config.ts")).toBe(true)
  })

  it("should have email service (Resend)", () => {
    expect(srcFileExists("lib/email/resend-provider.ts") || srcFileExists("lib/email/resend.ts")).toBe(true)
  })

  it("should have video/calendar integrations", () => {
    expect(srcFileExists("lib/integrations/google-org.ts")).toBe(true)
    expect(srcFileExists("lib/integrations/microsoft-org.ts")).toBe(true)
    expect(srcFileExists("lib/integrations/zoom-org.ts")).toBe(true)
  })

  describe("Multi-Tenant Architecture", () => {
    it("should have service client that bypasses RLS", () => {
      expect(srcFileExists("lib/supabase/service.ts")).toBe(true)
    })

    it("should have RBAC module", () => {
      expect(srcFileExists("lib/rbac/rbac-service.ts")).toBe(true)
    })

    it("should have department-level access control", () => {
      expect(srcFileExists("lib/auth/get-department-access.ts")).toBe(true)
    })
  })
})

// ============================================================
// BRD Section 5: Functional Requirements by Module
// ============================================================
describe("BRD 5 - Functional Requirements", () => {
  describe("Module: Auth & Multi-Tenancy", () => {
    it("should have login page", () => {
      expect(srcFileExists("app/(auth)/login/page.tsx")).toBe(true)
    })

    it("should have signup page", () => {
      expect(srcFileExists("app/(auth)/signup/page.tsx")).toBe(true)
    })

    it("should have password reset flow", () => {
      expect(srcFileExists("app/(auth)/forgot-password/page.tsx")).toBe(true)
      expect(srcFileExists("app/(auth)/reset-password/page.tsx")).toBe(true)
    })

    it("should have auth callback route", () => {
      expect(srcFileExists("app/auth/callback/route.ts")).toBe(true)
    })

    it("should have invite system", () => {
      expect(dirExists("src/app/api/invites")).toBe(true)
    })

    it("should have onboarding flow", () => {
      expect(srcFileExists("app/(auth)/onboarding/page.tsx")).toBe(true)
    })
  })

  describe("Module: Job Management", () => {
    it("should have job listing page", () => {
      expect(dirExists("src/app/(org)/org/jobs")).toBe(true)
    })

    it("should have job settings/edit page", () => {
      expect(dirExists("src/app/(org)/org/jobs/[id]")).toBe(true)
    })

    it("should have vacancy configuration", () => {
      expect(dirExists("src/app/(org)/org/vacancy-settings")).toBe(true)
    })
  })

  describe("Module: Candidate Management", () => {
    it("should have candidate database", () => {
      expect(dirExists("src/app/(org)/org/candidates")).toBe(true)
    })

    it("should have application tracking", () => {
      expect(dirExists("src/app/(org)/org/applications")).toBe(true)
    })

    it("should have application API with notes, attachments, screening", () => {
      expect(dirExists("src/app/api/applications")).toBe(true)
    })
  })

  describe("Module: Pipeline & Workflow", () => {
    it("should have pipeline configuration", () => {
      expect(dirExists("src/app/(org)/org/pipelines")).toBe(true)
    })

    it("should have document management", () => {
      expect(dirExists("src/app/(org)/org/documents")).toBe(true)
    })
  })

  describe("Module: Interview Management", () => {
    it("should have interview scheduling", () => {
      expect(dirExists("src/app/(org)/org/interviews")).toBe(true)
    })

    it("should have scorecard system", () => {
      expect(dirExists("src/app/(org)/org/scorecards")).toBe(true)
    })

    it("should have scorecard templates", () => {
      expect(dirExists("src/app/(org)/org/scorecard-templates")).toBe(true)
    })

    it("should have Google Calendar integration", () => {
      expect(dirExists("src/app/api/google/calendar")).toBe(true)
    })

    it("should have Microsoft Calendar integration", () => {
      expect(dirExists("src/app/api/microsoft/calendar")).toBe(true)
    })

    it("should have Zoom meeting creation", () => {
      expect(dirExists("src/app/api/zoom/meetings")).toBe(true)
    })
  })

  describe("Module: Offer Management", () => {
    it("should have offer management page", () => {
      expect(dirExists("src/app/(org)/org/offers")).toBe(true)
    })

    it("should have offer templates", () => {
      expect(dirExists("src/app/(org)/org/offers/templates")).toBe(true)
    })

    it("should have one-click accept/decline via email", () => {
      expect(srcFileExists("app/api/offers/respond/route.ts")).toBe(true)
      expect(srcFileExists("app/offers/respond/page.tsx")).toBe(true)
    })
  })

  describe("Module: Communication", () => {
    it("should have notification system", () => {
      expect(dirExists("src/app/api/notifications")).toBe(true)
      expect(srcFileExists("lib/notifications/send-notification.ts")).toBe(true)
    })

    it("should have email tracking (opens, clicks)", () => {
      expect(dirExists("src/app/api/email/track")).toBe(true)
    })

    it("should have email configuration", () => {
      expect(dirExists("src/app/(org)/org/settings/email")).toBe(true)
    })
  })

  describe("Module: AI Features", () => {
    it("should have resume parsing", () => {
      expect(srcFileExists("lib/ai/resume-parser.ts")).toBe(true)
    })

    it("should have candidate matching/scoring", () => {
      expect(srcFileExists("lib/ai/candidate-matcher.ts")).toBe(true)
    })

    it("should have job description generation", () => {
      expect(srcFileExists("lib/ai/job-generator.ts")).toBe(true)
    })

    it("should have email generation", () => {
      expect(srcFileExists("lib/ai/email-generator.ts")).toBe(true)
    })

    it("should have AI provider configuration (multi-provider)", () => {
      expect(srcFileExists("lib/ai/unified-client.ts")).toBe(true)
      expect(srcFileExists("lib/ai/org-ai-config.ts")).toBe(true)
    })

    it("should have AI settings page", () => {
      expect(dirExists("src/app/(org)/org/settings/ai")).toBe(true)
    })
  })

  describe("Module: Analytics & Reporting", () => {
    it("should have analytics page", () => {
      expect(dirExists("src/app/(org)/org/analytics")).toBe(true)
    })

    it("should have role-specific analytics", () => {
      expect(srcFileExists("lib/analytics/org-admin-stats.ts")).toBe(true)
      expect(srcFileExists("lib/analytics/recruiter-stats.ts")).toBe(true)
      expect(srcFileExists("lib/analytics/interviewer-stats.ts")).toBe(true)
    })

    it("should have role-specific dashboards", () => {
      expect(srcFileExists("app/(org)/org/dashboards/org-admin-dashboard.tsx")).toBe(true)
      expect(srcFileExists("app/(org)/org/dashboards/recruiter-dashboard.tsx")).toBe(true)
      expect(srcFileExists("app/(org)/org/dashboards/interviewer-dashboard.tsx")).toBe(true)
      expect(srcFileExists("app/(org)/org/dashboards/hiring-manager-dashboard.tsx")).toBe(true)
      expect(srcFileExists("app/(org)/org/dashboards/hr-manager-dashboard.tsx")).toBe(true)
    })
  })

  describe("Module: Career Portal (Public)", () => {
    it("should have public career page per organization", () => {
      expect(dirExists("src/app/careers/[orgSlug]")).toBe(true)
    })

    it("should have public job detail page with apply", () => {
      expect(dirExists("src/app/careers/[orgSlug]/jobs/[jobId]")).toBe(true)
    })

    it("should have career apply API", () => {
      expect(dirExists("src/app/api/careers/apply")).toBe(true)
    })
  })
})

// ============================================================
// BRD Section 3.2: Multi-Tenant Architecture
// ============================================================
describe("BRD 3.2 - Multi-Tenant Data Isolation", () => {
  it("should have org_id-based analytics queries", () => {
    const statsFile = fs.readFileSync(
      path.join(SRC, "lib/analytics/org-admin-stats.ts"),
      "utf-8"
    )
    expect(statsFile).toContain("org_id")
    expect(statsFile).toContain("orgId")
  })

  it("should have org_id-based dashboard queries", () => {
    const dashFile = fs.readFileSync(
      path.join(SRC, "app/(org)/org/dashboards/org-admin-dashboard.tsx"),
      "utf-8"
    )
    expect(dashFile).toContain("org_id")
  })

  it("should have route-role protection in middleware", () => {
    const middleware = fs.readFileSync(
      path.join(SRC, "lib/supabase/middleware.ts"),
      "utf-8"
    )
    expect(middleware).toContain("routeRoleMap")
    expect(middleware).toContain("isRouteAllowedForRole")
    expect(middleware).toContain("x-user-role")
  })
})

// ============================================================
// BRD Section: Language Support
// ============================================================
describe("BRD - Arabic/English Language Support", () => {
  it("should have English message files", () => {
    expect(dirExists("src/messages/en") || fileExists("src/messages/en.json")).toBe(true)
  })

  it("should have Arabic message files", () => {
    expect(dirExists("src/messages/ar") || fileExists("src/messages/ar.json")).toBe(true)
  })

  it("should have i18n library", () => {
    expect(srcFileExists("lib/i18n/index.ts")).toBe(true)
  })
})
