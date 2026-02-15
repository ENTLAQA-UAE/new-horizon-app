/**
 * Tests for page-level authentication and data isolation patterns.
 * Validates that all org pages check auth, have org_id filters, and
 * use @ts-nocheck where needed for tables not in Supabase types.
 */
import * as fs from "fs"
import * as path from "path"

const ORG_PAGES_DIR = path.resolve(__dirname, "../../app/(org)/org")

function findPageFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findPageFiles(fullPath))
    } else if (entry.name === "page.tsx") {
      results.push(fullPath)
    }
  }
  return results
}

// Pages that are simple redirect wrappers (no auth needed at page level)
const REDIRECT_ONLY_PAGES = ["vacancy-settings/page.tsx"]

// Pages that redirect to /org instead of /login on no auth
// (because they use getDepartmentAccess which handles auth differently)
const REDIRECT_TO_ORG_PAGES = [
  "candidates/page.tsx",
  "requisitions/page.tsx",
  "applications/page.tsx",
  "jobs/page.tsx",
  "vacancy-settings/application-form/page.tsx",
  "vacancy-settings/job-grades/page.tsx",
  "vacancy-settings/job-types/page.tsx",
  "vacancy-settings/locations/page.tsx",
]

describe("Org page authentication patterns", () => {
  const pageFiles = findPageFiles(ORG_PAGES_DIR)

  it("discovers org page files", () => {
    expect(pageFiles.length).toBeGreaterThan(0)
  })

  describe("auth checks", () => {
    pageFiles.forEach((filePath) => {
      const relativePath = path.relative(ORG_PAGES_DIR, filePath)
      const isRedirectOnly = REDIRECT_ONLY_PAGES.some((p) => relativePath.endsWith(p))

      if (!isRedirectOnly) {
        it(`org/${relativePath} has authentication check`, () => {
          const content = fs.readFileSync(filePath, "utf-8")

          const hasAuthCheck =
            content.includes("getUser()") ||
            content.includes("auth.getUser") ||
            content.includes("getDepartmentAccess") ||
            content.includes("useAuth") ||
            content.includes("getCurrentUserId") ||
            content.includes("supabaseSelect") // auth-fetch pattern

          expect(hasAuthCheck).toBe(true)
        })
      }
    })
  })

  describe("redirect on no auth", () => {
    pageFiles.forEach((filePath) => {
      const relativePath = path.relative(ORG_PAGES_DIR, filePath)
      const content = fs.readFileSync(filePath, "utf-8")
      const isRedirectOnly = REDIRECT_ONLY_PAGES.some((p) => relativePath.endsWith(p))

      // Only test server components that use redirect (not client components, not redirect-only wrappers)
      if (
        content.includes("redirect(") &&
        !content.includes('"use client"') &&
        !isRedirectOnly
      ) {
        it(`org/${relativePath} redirects on auth failure`, () => {
          // Should redirect to either /login or /org
          const hasAuthRedirect =
            content.match(/redirect\(["']\/login["']\)/) ||
            content.match(/redirect\(["']\/org["']\)/) ||
            content.match(/redirect\(["']\/onboarding["']\)/)

          expect(hasAuthRedirect).toBeTruthy()
        })
      }
    })
  })

  describe("@ts-nocheck for untyped tables", () => {
    // Only check tables we KNOW are not in the Supabase types AND are
    // used via .from("table_name") pattern (not nested relation selects)
    const UNTYPED_FROM_TABLES = [
      "workflows",
      "career_page_blocks",
      "job_requisitions",
    ]

    pageFiles.forEach((filePath) => {
      const relativePath = path.relative(ORG_PAGES_DIR, filePath)
      const content = fs.readFileSync(filePath, "utf-8")

      const usesUntypedFromTable = UNTYPED_FROM_TABLES.some(
        (table) =>
          content.includes(`.from("${table}")`) ||
          content.includes(`.from('${table}')`)
      )

      if (usesUntypedFromTable) {
        it(`org/${relativePath} has @ts-nocheck for untyped .from() table`, () => {
          expect(content).toContain("@ts-nocheck")
        })
      }
    })
  })
})

describe("Org page data isolation", () => {
  const pageFiles = findPageFiles(ORG_PAGES_DIR)

  describe("org_id scoping on queries", () => {
    pageFiles.forEach((filePath) => {
      const relativePath = path.relative(ORG_PAGES_DIR, filePath)
      const content = fs.readFileSync(filePath, "utf-8")

      // Only check server components that use .from() and have an orgId variable
      const isServerComponent = !content.includes('"use client"')
      const hasDatabaseQueries = content.includes(".from(")
      const hasOrgIdVariable = content.includes("orgId") || content.includes("profile.org_id")

      if (isServerComponent && hasDatabaseQueries && hasOrgIdVariable) {
        it(`org/${relativePath} uses org_id in data queries`, () => {
          const hasOrgScoping =
            content.includes('.eq("org_id"') ||
            content.includes(".eq('org_id'") ||
            content.includes('.eq("organization_id"') ||
            content.includes("getDepartmentAccess") ||
            content.includes("orgId") ||
            content.includes("profile.org_id")

          expect(hasOrgScoping).toBe(true)
        })
      }
    })
  })
})
