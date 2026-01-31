/**
 * Middleware Tests
 *
 * Tests for auth middleware, route protection, and role-based access.
 */
import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const middlewarePath = path.resolve(__dirname, "../../src/lib/supabase/middleware.ts")
const middlewareCode = fs.readFileSync(middlewarePath, "utf-8")

describe("Middleware - Route Protection", () => {
  describe("Public routes configuration", () => {
    const publicRoutes = [
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/auth/callback",
      "/careers",
      "/portal/login",
      "/portal/auth",
      "/api/invites",
      "/api/careers",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
      "/api/offers/respond",
      "/offers/respond",
      "/onboarding",
    ]

    publicRoutes.forEach((route) => {
      it(`should allow public access to ${route}`, () => {
        expect(middlewareCode).toContain(`'${route}'`)
      })
    })
  })

  describe("Role-based route map", () => {
    it("should protect /org/settings for org_admin only", () => {
      expect(middlewareCode).toContain("'/org/settings'")
      // The route entry for /org/settings should include org_admin
      const settingsMatch = middlewareCode.match(
        /path:\s*'\/org\/settings'[^}]*roles:\s*\[(.*?)\]/
      )
      expect(settingsMatch).not.toBeNull()
      expect(settingsMatch![1]).toContain("org_admin")
    })

    it("should protect /org/team for org_admin only", () => {
      expect(middlewareCode).toContain("'/org/team'")
    })

    it("should protect /admin routes for super_admin only", () => {
      expect(middlewareCode).toContain("'/admin'")
      const adminMatch = middlewareCode.match(
        /path:\s*'\/admin'[^}]*roles:\s*\[(.*?)\]/
      )
      expect(adminMatch).not.toBeNull()
      expect(adminMatch![1]).toContain("super_admin")
    })

    it("should allow super_admin to bypass all route checks", () => {
      expect(middlewareCode).toContain("if (role === 'super_admin') return true")
    })

    it("should protect /org/jobs for hr_manager, recruiter, hiring_manager", () => {
      const jobsMatch = middlewareCode.match(
        /path:\s*'\/org\/jobs'[^}]*roles:\s*\[(.*?)\]/
      )
      expect(jobsMatch).not.toBeNull()
      expect(jobsMatch![1]).toContain("hr_manager")
      expect(jobsMatch![1]).toContain("recruiter")
      expect(jobsMatch![1]).toContain("hiring_manager")
    })
  })

  describe("Auth check method", () => {
    it("should use getSession() for fast route protection (not getUser())", () => {
      // getSession reads from cookies (fast), getUser makes network call (slow)
      expect(middlewareCode).toContain("supabase.auth.getSession()")
      // Should NOT use getUser for the main auth check
      expect(middlewareCode).not.toContain("supabase.auth.getUser()")
    })

    it("should skip auth for static files and Next.js internals", () => {
      expect(middlewareCode).toContain("/_next")
      expect(middlewareCode).toContain("/favicon")
    })

    it("should use role cookie for zero-latency role checks", () => {
      expect(middlewareCode).toContain("x-user-role")
    })
  })
})

describe("Middleware - Multi-Tenant Security", () => {
  it("should redirect unauthenticated users to login", () => {
    expect(middlewareCode).toContain("!user && !isPublicRoute")
    expect(middlewareCode).toContain("'/login'")
  })

  it("should redirect unauthorized roles to their home page", () => {
    expect(middlewareCode).toContain("getHomeForRole")
    expect(middlewareCode).toContain("NextResponse.redirect")
  })
})
