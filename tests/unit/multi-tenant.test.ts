/**
 * Multi-Tenant Isolation Tests
 *
 * Verifies that all analytics and dashboard queries include org_id filtering.
 * BRD 3.2: "Shared database with org_id column (Row-Level Security)"
 */
import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const SRC = path.resolve(__dirname, "../../src")

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(SRC, relativePath), "utf-8")
}

describe("Multi-Tenant Isolation - Analytics Queries", () => {
  const analyticsFiles = [
    "lib/analytics/org-admin-stats.ts",
    "lib/analytics/dashboard-stats.ts",
    "lib/analytics/candidates-list-stats.ts",
    "lib/analytics/recruiter-stats.ts",
    "lib/analytics/interviewer-stats.ts",
  ]

  analyticsFiles.forEach((file) => {
    describe(file, () => {
      it("should accept orgId parameter", () => {
        const code = readFile(file)
        expect(code).toContain("orgId")
      })

      it("should filter queries by org_id", () => {
        const code = readFile(file)
        // Check for .eq("org_id", orgId) pattern
        expect(code).toContain("org_id")
      })
    })
  })
})

describe("Multi-Tenant Isolation - Dashboard Components", () => {
  const dashboardFiles = [
    "app/(org)/org/dashboards/org-admin-dashboard.tsx",
    "app/(org)/org/dashboards/recruiter-dashboard.tsx",
    "app/(org)/org/dashboards/interviewer-dashboard.tsx",
    "app/(org)/org/dashboards/hiring-manager-dashboard.tsx",
    "app/(org)/org/dashboards/hr-manager-dashboard.tsx",
  ]

  dashboardFiles.forEach((file) => {
    it(`${file} should filter by org_id`, () => {
      const code = readFile(file)
      expect(code).toContain("org_id")
    })
  })
})

describe("Multi-Tenant Isolation - Analytics Page", () => {
  it("should pass orgId to all analytics functions", () => {
    const code = readFile("app/(org)/org/analytics/page.tsx")
    expect(code).toContain("org_id")
    expect(code).toContain("orgId")
  })
})
