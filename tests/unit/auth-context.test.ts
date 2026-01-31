/**
 * Auth Context Tests
 *
 * Tests for authentication state management, login/logout flows,
 * and token refresh optimization.
 */
import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const SRC = path.resolve(__dirname, "../../src")

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(SRC, relativePath), "utf-8")
}

describe("AuthProvider - Session Management", () => {
  const authContext = readFile("lib/auth/auth-context.tsx")

  it("should export AuthState interface with required fields", () => {
    expect(authContext).toContain("isLoading: boolean")
    expect(authContext).toContain("isAuthenticated: boolean")
    expect(authContext).toContain("user: User | null")
    expect(authContext).toContain("session: Session | null")
    expect(authContext).toContain("profile: UserProfile | null")
    expect(authContext).toContain("organization: UserOrganization | null")
    expect(authContext).toContain("roles: UserRole[]")
    expect(authContext).toContain("primaryRole: UserRole | null")
  })

  it("should define all BRD roles", () => {
    expect(authContext).toContain("super_admin")
    expect(authContext).toContain("org_admin")
    expect(authContext).toContain("hr_manager")
    expect(authContext).toContain("recruiter")
    expect(authContext).toContain("hiring_manager")
    expect(authContext).toContain("interviewer")
  })

  it("should have role priority ordering", () => {
    // super_admin should be highest priority
    const priorityMatch = authContext.match(/rolePriority.*?\[([^\]]+)\]/s)
    expect(priorityMatch).not.toBeNull()
    const roles = priorityMatch![1]
    const superAdminPos = roles.indexOf("super_admin")
    const orgAdminPos = roles.indexOf("org_admin")
    expect(superAdminPos).toBeLessThan(orgAdminPos)
  })

  it("should have safety timeout to prevent infinite loading", () => {
    expect(authContext).toContain("safetyTimeoutId")
    expect(authContext).toContain("20000") // 20 second max
  })
})

describe("AuthProvider - Sign Out Optimization", () => {
  const authContext = readFile("lib/auth/auth-context.tsx")

  it("should use local scope for fast signout", () => {
    expect(authContext).toContain("scope: 'local'")
    // Should NOT use global scope (slow server roundtrip)
    expect(authContext).not.toContain("scope: 'global'")
  })

  it("should have a reasonable timeout for signout", () => {
    // Should be 2s or less, not 5s
    const timeoutMatch = authContext.match(
      /Sign out timeout.*?(\d+)/
    )
    expect(timeoutMatch).not.toBeNull()
    expect(parseInt(timeoutMatch![1])).toBeLessThanOrEqual(3000)
  })

  it("should clear all auth state on signout", () => {
    expect(authContext).toContain("clearTokenCache")
    expect(authContext).toContain("fullCleanup")
    expect(authContext).toContain("clearAuthCookies")
  })
})

describe("AuthProvider - Token Refresh Optimization", () => {
  const authContext = readFile("lib/auth/auth-context.tsx")

  it("should handle TOKEN_REFRESHED separately from SIGNED_IN", () => {
    expect(authContext).toContain('event === "TOKEN_REFRESHED"')
    expect(authContext).toContain('event === "SIGNED_IN"')
  })

  it("should only update session on TOKEN_REFRESHED (no full refetch)", () => {
    // TOKEN_REFRESHED handler should update session/user only
    const tokenRefreshBlock = authContext.match(
      /TOKEN_REFRESHED.*?(?=else if|$)/s
    )
    expect(tokenRefreshBlock).not.toBeNull()
    const block = tokenRefreshBlock![0]
    // Should NOT call loadAuth in TOKEN_REFRESHED block
    expect(block).not.toContain("await loadAuth")
    // Should update session
    expect(block).toContain("session")
  })
})

describe("Login Page - Performance", () => {
  const loginPage = readFile("app/(auth)/login/page.tsx")

  it("should use router.push for client-side navigation (not window.location)", () => {
    expect(loginPage).toContain("router.push")
    // The login redirect should not use window.location.href = "/"
    expect(loginPage).not.toMatch(/window\.location\.href\s*=\s*["']\/["']/)
  })

  it("should NOT have artificial delays before redirect", () => {
    // Should not have setTimeout before navigation
    expect(loginPage).not.toContain("setTimeout(resolve, 100)")
  })

  it("should NOT reset Supabase client singleton during login", () => {
    // resetSupabaseClient breaks the AuthProvider's event listener
    expect(loginPage).not.toContain("resetSupabaseClient")
  })
})

describe("Password Change - No Auth Side Effects", () => {
  const profilePage = readFile("app/(org)/org/profile/page.tsx")

  it("should verify current password via direct REST call, not signInWithPassword", () => {
    // signInWithPassword triggers SIGNED_IN event → full auth reload
    expect(profilePage).toContain("/auth/v1/token?grant_type=password")
    // Should NOT use supabase.auth.signInWithPassword for verification
    expect(profilePage).not.toContain("signInWithPassword")
  })

  it("should use updateUser for password change", () => {
    expect(profilePage).toContain("updateUser")
    expect(profilePage).toContain("password: newPassword")
  })
})

describe("getDepartmentAccess - Query Optimization", () => {
  const deptAccess = readFile("lib/auth/get-department-access.ts")

  it("should fetch profile and role in parallel", () => {
    expect(deptAccess).toContain("Promise.all")
  })

  it("should only fetch departments for hiring_manager role", () => {
    expect(deptAccess).toContain('role !== "hiring_manager"')
    expect(deptAccess).toContain("user_role_departments")
  })
})
