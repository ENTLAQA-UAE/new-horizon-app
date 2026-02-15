/**
 * Tests for API route authentication patterns.
 * Validates that all API routes follow consistent auth patterns.
 */
import * as fs from "fs"
import * as path from "path"

const API_DIR = path.resolve(__dirname, "../../app/api")

// Helper to recursively find all route.ts files
function findRouteFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findRouteFiles(fullPath))
    } else if (entry.name === "route.ts") {
      results.push(fullPath)
    }
  }
  return results
}

// Routes that intentionally don't require auth
const PUBLIC_API_ROUTES = [
  "api/health",
  "api/careers/apply",
  "api/invites/validate",
  "api/auth/forgot-password",
  "api/offers/respond",
  "api/email/track/open",
  "api/email/track/click",
  "api/email/webhooks",
  "api/zoom/webhook",
]

describe("API route security patterns", () => {
  const routeFiles = findRouteFiles(API_DIR)

  it("discovers API route files", () => {
    expect(routeFiles.length).toBeGreaterThan(0)
  })

  describe("auth checks", () => {
    routeFiles.forEach((filePath) => {
      const relativePath = path.relative(path.resolve(__dirname, "../../app"), filePath)
      const isPublic = PUBLIC_API_ROUTES.some((route) =>
        relativePath.replace(/[/\\]/g, "/").includes(route.replace("api/", "api/"))
      )

      if (!isPublic) {
        it(`${relativePath} should have auth check`, () => {
          const content = fs.readFileSync(filePath, "utf-8")

          // Protected routes should check auth via one of these patterns:
          const hasAuthCheck =
            content.includes("getUser()") ||
            content.includes("getSession()") ||
            content.includes("auth.getUser") ||
            content.includes("auth.getSession") ||
            content.includes("SUPABASE_SERVICE_ROLE_KEY") ||
            content.includes("createServiceClient") ||
            content.includes("service_role") ||
            content.includes("Unauthorized")

          expect(hasAuthCheck).toBe(true)
        })
      }
    })
  })

  describe("response format", () => {
    routeFiles.forEach((filePath) => {
      const relativePath = path.relative(path.resolve(__dirname, "../../app"), filePath)

      it(`${relativePath} uses proper JSON responses`, () => {
        const content = fs.readFileSync(filePath, "utf-8")

        // Should use NextResponse.json(), redirect(), or custom response helpers
        const hasProperResponse =
          content.includes("NextResponse.json") ||
          content.includes("NextResponse(JSON.stringify") ||
          content.includes("NextResponse.redirect") ||
          content.includes("new NextResponse(") ||
          content.includes("jsonResponse") ||
          content.includes("new Response")

        expect(hasProperResponse).toBe(true)
      })
    })
  })

  describe("HTTP method exports", () => {
    routeFiles.forEach((filePath) => {
      const relativePath = path.relative(path.resolve(__dirname, "../../app"), filePath)

      it(`${relativePath} exports at least one HTTP method`, () => {
        const content = fs.readFileSync(filePath, "utf-8")

        const hasMethod =
          content.includes("export async function GET") ||
          content.includes("export async function POST") ||
          content.includes("export async function PUT") ||
          content.includes("export async function DELETE") ||
          content.includes("export async function PATCH") ||
          content.includes("export function GET") ||
          content.includes("export function POST")

        expect(hasMethod).toBe(true)
      })
    })
  })

  describe("service role usage", () => {
    const routesRequiringServiceRole = [
      "org/create", // Org creation (role assignment bypasses RLS)
      "invites/accept", // Invite acceptance (role assignment bypasses RLS)
      "admin/users", // Admin user management
      "admin/landing-page", // Admin landing page config
    ]

    routeFiles.forEach((filePath) => {
      const relativePath = path
        .relative(path.resolve(__dirname, "../../app/api"), filePath)
        .replace(/[/\\]/g, "/")
        .replace("/route.ts", "")

      if (routesRequiringServiceRole.some((r) => relativePath.includes(r))) {
        it(`${relativePath} uses service role client`, () => {
          const content = fs.readFileSync(filePath, "utf-8")

          const usesServiceRole =
            content.includes("createServiceClient") ||
            content.includes("SUPABASE_SERVICE_ROLE_KEY") ||
            content.includes("service_role")

          expect(usesServiceRole).toBe(true)
        })
      }
    })
  })
})
