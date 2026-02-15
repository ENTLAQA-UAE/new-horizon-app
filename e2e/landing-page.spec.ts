import { test, expect } from "@playwright/test"

test.describe("Landing Page", () => {
  test("loads the landing page for unauthenticated users", async ({ page }) => {
    await page.goto("/")

    // Should see the hero section
    await expect(page.locator("text=Hire the Best Talent")).toBeVisible()

    // Should have a Get Started CTA
    await expect(page.locator('a:has-text("Get Started")').first()).toBeVisible()
  })

  test("has working navigation links", async ({ page }) => {
    await page.goto("/")

    // Navbar should be visible
    await expect(page.locator("nav")).toBeVisible()

    // Login link should be accessible
    const loginLink = page.locator('a[href="/login"]').first()
    if (await loginLink.isVisible()) {
      await loginLink.click()
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test("language toggle switches to Arabic", async ({ page }) => {
    await page.goto("/")

    // Find and click language toggle
    const langToggle = page.locator('button:has-text("العربية"), button:has-text("AR")')
    if (await langToggle.isVisible()) {
      await langToggle.click()

      // Page should now show Arabic text
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
    }
  })

  test("signup link navigates correctly", async ({ page }) => {
    await page.goto("/")

    const signupLink = page.locator('a[href="/signup"]').first()
    if (await signupLink.isVisible()) {
      await signupLink.click()
      await expect(page).toHaveURL(/\/signup/)
    }
  })
})
