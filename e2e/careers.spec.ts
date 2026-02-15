import { test, expect } from "@playwright/test"

test.describe("Public Career Pages", () => {
  test("career page returns a response", async ({ page }) => {
    // Career pages are accessed via org slug
    // This tests the routing works (even if no org exists, it should not crash)
    const response = await page.goto("/careers/demo")

    // Should get a response (200 for existing org, 404 for non-existing)
    expect(response).not.toBeNull()
    expect(response!.status()).toBeLessThan(500)
  })

  test("job application form validates required fields", async ({ page }) => {
    // Skip if no test org is configured
    test.skip(!process.env.TEST_ORG_SLUG, "Requires TEST_ORG_SLUG with open jobs")

    const orgSlug = process.env.TEST_ORG_SLUG!
    await page.goto(`/careers/${orgSlug}`)

    // Click on the first job listing if available
    const jobLink = page.locator('a[href*="/jobs/"]').first()
    if (await jobLink.isVisible()) {
      await jobLink.click()

      // Try to submit empty form
      const submitBtn = page.locator('button[type="submit"]')
      if (await submitBtn.isVisible()) {
        await submitBtn.click()

        // Should show validation errors for required fields
        await expect(
          page.locator('[data-error], .text-destructive, .text-red-500, [aria-invalid="true"]').first()
        ).toBeVisible({ timeout: 5_000 })
      }
    }
  })
})
