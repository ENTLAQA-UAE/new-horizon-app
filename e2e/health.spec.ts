import { test, expect } from "@playwright/test"

test.describe("Health Check", () => {
  test("health endpoint returns valid JSON", async ({ request }) => {
    const response = await request.get("/api/health")

    // Should return 200 or 503
    expect([200, 503]).toContain(response.status())

    const body = await response.json()

    // Should have expected shape
    expect(body).toHaveProperty("status")
    expect(body).toHaveProperty("checks")
    expect(body).toHaveProperty("timestamp")
    expect(body.checks).toHaveProperty("server", "ok")
  })
})
