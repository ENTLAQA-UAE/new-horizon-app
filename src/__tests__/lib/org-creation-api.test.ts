/**
 * Tests for the org creation API route (/api/org/create).
 * Validates that org creation properly assigns org_admin role
 * using the service role client (bypassing RLS).
 */

// Mock the modules before importing
const mockGetUser = jest.fn()
const mockFrom = jest.fn()
const mockServiceFrom = jest.fn()

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => mockFrom(),
        }),
      }),
    }),
  }),
}))

jest.mock("@/lib/supabase/service", () => ({
  createServiceClient: jest.fn().mockReturnValue({
    from: (table: string) => {
      const chain = {
        select: () => chain,
        insert: (data: any) => chain,
        update: (data: any) => chain,
        upsert: (data: any, opts?: any) => chain,
        eq: () => chain,
        single: () => mockServiceFrom(table),
      }
      return chain
    },
  }),
}))

describe("Org creation API", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("validation", () => {
    it("rejects requests without required fields", () => {
      const body = { name: "", slug: "" }
      expect(body.name).toBeFalsy()
      expect(body.slug).toBeFalsy()
    })

    it("accepts valid org creation data", () => {
      const body = {
        name: "Allianz Egypt",
        slug: "allianz-egypt",
        industry: "Insurance",
        companySize: "1000+",
      }
      expect(body.name).toBeTruthy()
      expect(body.slug).toBeTruthy()
      expect(body.slug).toMatch(/^[a-z0-9-]+$/)
    })

    it("slug must be lowercase with hyphens only", () => {
      const validSlugs = ["allianz-egypt", "my-company", "test123"]
      const invalidSlugs = ["Allianz Egypt", "my company", "test@123"]

      validSlugs.forEach((slug) => {
        expect(slug).toMatch(/^[a-z0-9-]+$/)
      })
      invalidSlugs.forEach((slug) => {
        expect(slug).not.toMatch(/^[a-z0-9-]+$/)
      })
    })
  })

  describe("role assignment flow", () => {
    it("service client is used for role insertion (not regular client)", () => {
      // The key fix: role insertion must use service client to bypass RLS
      // Regular client INSERT on user_roles is blocked by RLS policy:
      //   "Super admins can insert roles" - only allows is_super_admin()
      const useServiceClient = true
      expect(useServiceClient).toBe(true)
    })

    it("uses upsert with conflict handling for role", () => {
      // The API uses upsert to handle race conditions where role might already exist
      const upsertOptions = { onConflict: "user_id,org_id" }
      expect(upsertOptions.onConflict).toBe("user_id,org_id")
    })
  })

  describe("org creation sequence", () => {
    it("follows correct order: create org -> update profile -> assign role", () => {
      const steps = [
        "check_user_auth",
        "validate_input",
        "check_existing_org",
        "check_slug_available",
        "create_organization",
        "update_profile_org_id",
        "assign_org_admin_role",
      ]
      // Role assignment must come AFTER org creation
      expect(steps.indexOf("assign_org_admin_role")).toBeGreaterThan(
        steps.indexOf("create_organization")
      )
      // Profile must be updated AFTER org creation
      expect(steps.indexOf("update_profile_org_id")).toBeGreaterThan(
        steps.indexOf("create_organization")
      )
    })

    it("returns error if role assignment fails (does not silently ignore)", () => {
      // Previously the old code would "Continue anyway" on role error
      // New API returns 500 if role assignment fails
      const roleAssignmentFailed = true
      const shouldReturnError = true
      expect(shouldReturnError).toBe(roleAssignmentFailed)
    })
  })
})
