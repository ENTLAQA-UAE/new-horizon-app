/**
 * Tests for the route-role authorization logic used in middleware.
 * This mirrors the isRouteAllowedForRole function from middleware.ts.
 */

const routeRoleMap: { path: string; roles: string[] }[] = [
  { path: "/org/settings/notifications", roles: ["hr_manager"] },
  { path: "/org/settings/integrations", roles: ["org_admin"] },
  { path: "/org/settings/email", roles: ["org_admin"] },
  { path: "/org/settings/domain", roles: ["org_admin"] },
  { path: "/org/settings", roles: ["org_admin"] },
  { path: "/org/team", roles: ["org_admin"] },
  { path: "/org/departments", roles: ["org_admin"] },
  { path: "/org/branding", roles: ["org_admin"] },
  { path: "/org/career-page", roles: ["org_admin"] },
  { path: "/org/pipelines", roles: ["hr_manager"] },
  { path: "/org/workflows", roles: ["hr_manager"] },
  { path: "/org/offers/templates", roles: ["hr_manager"] },
  { path: "/org/scorecard-templates", roles: ["hr_manager"] },
  { path: "/org/screening-questions", roles: ["hr_manager"] },
  { path: "/org/vacancy-settings", roles: ["hr_manager"] },
  { path: "/org/analytics", roles: ["org_admin", "hr_manager", "recruiter", "interviewer"] },
  { path: "/org/jobs", roles: ["hr_manager", "recruiter", "hiring_manager"] },
  { path: "/org/candidates", roles: ["hr_manager", "recruiter", "hiring_manager"] },
  { path: "/org/applications", roles: ["hr_manager", "recruiter", "hiring_manager"] },
  { path: "/org/requisitions", roles: ["hr_manager", "recruiter", "hiring_manager"] },
  { path: "/org/offers", roles: ["hr_manager", "recruiter"] },
  { path: "/org/interviews", roles: ["hr_manager", "recruiter", "hiring_manager", "interviewer"] },
  { path: "/org/scorecards", roles: ["hr_manager", "recruiter", "hiring_manager", "interviewer"] },
  { path: "/org/documents", roles: ["hr_manager", "recruiter"] },
  { path: "/org", roles: ["org_admin", "hr_manager", "recruiter", "hiring_manager", "interviewer"] },
  { path: "/admin", roles: ["super_admin"] },
  { path: "/organizations", roles: ["super_admin"] },
  { path: "/users", roles: ["super_admin"] },
  { path: "/tiers", roles: ["super_admin"] },
  { path: "/billing", roles: ["super_admin"] },
  { path: "/audit-logs", roles: ["super_admin"] },
  { path: "/settings", roles: ["super_admin"] },
]

function isRouteAllowedForRole(pathname: string, role: string): boolean {
  if (role === "super_admin") return true

  for (const route of routeRoleMap) {
    if (pathname === route.path || pathname.startsWith(route.path + "/")) {
      return route.roles.includes(role)
    }
  }

  return true
}

describe("Route-role authorization", () => {
  describe("super_admin", () => {
    it("can access all routes", () => {
      expect(isRouteAllowedForRole("/admin", "super_admin")).toBe(true)
      expect(isRouteAllowedForRole("/org/jobs", "super_admin")).toBe(true)
      expect(isRouteAllowedForRole("/org/settings", "super_admin")).toBe(true)
      expect(isRouteAllowedForRole("/billing", "super_admin")).toBe(true)
    })
  })

  describe("org_admin", () => {
    it("can access org settings", () => {
      expect(isRouteAllowedForRole("/org/settings", "org_admin")).toBe(true)
      expect(isRouteAllowedForRole("/org/settings/integrations", "org_admin")).toBe(true)
      expect(isRouteAllowedForRole("/org/settings/email", "org_admin")).toBe(true)
    })

    it("can access org dashboard", () => {
      expect(isRouteAllowedForRole("/org", "org_admin")).toBe(true)
    })

    it("cannot access admin routes", () => {
      expect(isRouteAllowedForRole("/admin", "org_admin")).toBe(false)
      expect(isRouteAllowedForRole("/billing", "org_admin")).toBe(false)
    })

    it("cannot access HR configuration routes", () => {
      expect(isRouteAllowedForRole("/org/pipelines", "org_admin")).toBe(false)
      expect(isRouteAllowedForRole("/org/workflows", "org_admin")).toBe(false)
    })
  })

  describe("hr_manager", () => {
    it("can access HR configuration routes", () => {
      expect(isRouteAllowedForRole("/org/pipelines", "hr_manager")).toBe(true)
      expect(isRouteAllowedForRole("/org/workflows", "hr_manager")).toBe(true)
      expect(isRouteAllowedForRole("/org/screening-questions", "hr_manager")).toBe(true)
    })

    it("can access ATS core routes", () => {
      expect(isRouteAllowedForRole("/org/jobs", "hr_manager")).toBe(true)
      expect(isRouteAllowedForRole("/org/candidates", "hr_manager")).toBe(true)
      expect(isRouteAllowedForRole("/org/applications", "hr_manager")).toBe(true)
    })

    it("can access notification settings", () => {
      expect(isRouteAllowedForRole("/org/settings/notifications", "hr_manager")).toBe(true)
    })

    it("cannot access org settings", () => {
      expect(isRouteAllowedForRole("/org/settings", "hr_manager")).toBe(false)
      expect(isRouteAllowedForRole("/org/settings/integrations", "hr_manager")).toBe(false)
    })
  })

  describe("recruiter", () => {
    it("can access ATS core routes", () => {
      expect(isRouteAllowedForRole("/org/jobs", "recruiter")).toBe(true)
      expect(isRouteAllowedForRole("/org/candidates", "recruiter")).toBe(true)
      expect(isRouteAllowedForRole("/org/applications", "recruiter")).toBe(true)
    })

    it("can access analytics", () => {
      expect(isRouteAllowedForRole("/org/analytics", "recruiter")).toBe(true)
    })

    it("cannot access HR config or org settings", () => {
      expect(isRouteAllowedForRole("/org/pipelines", "recruiter")).toBe(false)
      expect(isRouteAllowedForRole("/org/settings", "recruiter")).toBe(false)
    })
  })

  describe("hiring_manager", () => {
    it("can access jobs, candidates, applications", () => {
      expect(isRouteAllowedForRole("/org/jobs", "hiring_manager")).toBe(true)
      expect(isRouteAllowedForRole("/org/candidates", "hiring_manager")).toBe(true)
    })

    it("can access interviews", () => {
      expect(isRouteAllowedForRole("/org/interviews", "hiring_manager")).toBe(true)
    })

    it("cannot access analytics", () => {
      expect(isRouteAllowedForRole("/org/analytics", "hiring_manager")).toBe(false)
    })

    it("cannot access offers", () => {
      expect(isRouteAllowedForRole("/org/offers", "hiring_manager")).toBe(false)
    })
  })

  describe("interviewer", () => {
    it("can access interviews and scorecards", () => {
      expect(isRouteAllowedForRole("/org/interviews", "interviewer")).toBe(true)
      expect(isRouteAllowedForRole("/org/scorecards", "interviewer")).toBe(true)
    })

    it("can access analytics", () => {
      expect(isRouteAllowedForRole("/org/analytics", "interviewer")).toBe(true)
    })

    it("cannot access jobs or candidates directly", () => {
      expect(isRouteAllowedForRole("/org/jobs", "interviewer")).toBe(false)
      expect(isRouteAllowedForRole("/org/candidates", "interviewer")).toBe(false)
    })
  })

  describe("sub-route matching", () => {
    it("matches sub-routes correctly", () => {
      expect(isRouteAllowedForRole("/org/jobs/123/settings", "recruiter")).toBe(true)
      expect(isRouteAllowedForRole("/org/settings/domain/verify", "org_admin")).toBe(true)
    })

    it("unknown routes are allowed by default", () => {
      expect(isRouteAllowedForRole("/onboarding", "recruiter")).toBe(true)
      expect(isRouteAllowedForRole("/unknown-page", "interviewer")).toBe(true)
    })
  })
})
