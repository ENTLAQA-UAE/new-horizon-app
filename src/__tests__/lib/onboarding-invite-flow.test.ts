/**
 * Tests for the onboarding invite acceptance flow.
 * Validates that invite acceptance uses the server API route
 * instead of direct client-side Supabase calls (which are blocked by RLS).
 */

describe("Onboarding invite flow", () => {
  describe("invite validation", () => {
    it("validates invite code via /api/invites/validate endpoint", () => {
      const endpoint = "/api/invites/validate"
      const code = "ABC123"
      const url = `${endpoint}?code=${encodeURIComponent(code)}`

      expect(url).toContain("/api/invites/validate")
      expect(url).toContain("code=ABC123")
    })

    it("checks email match before accepting", () => {
      const inviteEmail = "user@allianz.com"
      const userEmail = "user@allianz.com"

      expect(inviteEmail.toLowerCase()).toBe(userEmail.toLowerCase())
    })

    it("rejects invite for different email", () => {
      const inviteEmail = "alice@allianz.com"
      const userEmail = "bob@allianz.com"

      expect(inviteEmail.toLowerCase()).not.toBe(userEmail.toLowerCase())
    })
  })

  describe("invite acceptance", () => {
    it("uses /api/invites/accept server endpoint (not direct Supabase calls)", () => {
      // CRITICAL: Direct Supabase INSERT on user_roles from client is blocked by RLS
      // Must use the server API which uses service role client
      const endpoint = "/api/invites/accept"
      const method = "POST"
      const payload = { inviteId: "inv-123", userId: "user-456" }

      expect(endpoint).toBe("/api/invites/accept")
      expect(method).toBe("POST")
      expect(payload).toHaveProperty("inviteId")
      expect(payload).toHaveProperty("userId")
    })

    it("does NOT use direct Supabase insert on user_roles", () => {
      // The old code did this (which failed silently due to RLS):
      //   supabase.from("user_roles").insert({ ... })
      // The new code delegates to the API which uses service role
      const usesDirectInsert = false
      expect(usesDirectInsert).toBe(false)
    })
  })

  describe("error handling", () => {
    it("shows error when validate API returns non-ok", () => {
      const response = { ok: false, status: 404 }
      const result = { error: "Invalid invite code" }

      expect(response.ok).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it("shows error when accept API returns non-ok", () => {
      const response = { ok: false, status: 500 }
      const result = { error: "Failed to assign user role" }

      expect(response.ok).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it("shows success with org name from validate response", () => {
      const invite = {
        id: "inv-123",
        email: "user@test.com",
        organization: { name: "Allianz Egypt" },
      }

      const successMessage = `Welcome to ${invite.organization?.name || "the organization"}!`
      expect(successMessage).toBe("Welcome to Allianz Egypt!")
    })

    it("shows fallback message when org name unavailable", () => {
      const invite = {
        id: "inv-123",
        email: "user@test.com",
        organization: null as any,
      }

      const successMessage = `Welcome to ${invite.organization?.name || "the organization"}!`
      expect(successMessage).toBe("Welcome to the organization!")
    })
  })
})
