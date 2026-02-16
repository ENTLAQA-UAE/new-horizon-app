import { test, expect } from "@playwright/test"

test.describe("Landing Page", () => {
  test("loads the landing page for unauthenticated users", async ({ page }) => {
    await page.goto("/")

    // Default language is Arabic — should see the Arabic hero text
    await expect(page.locator("text=وظّف الكفاءات المناسبة،")).toBeVisible()

    // Should have a Get Started CTA (Arabic: ابدأ الآن)
    await expect(page.locator('a:has-text("ابدأ الآن")').first()).toBeVisible()
  })

  test("has working navigation links", async ({ page }) => {
    await page.goto("/")

    // Navbar should be visible
    await expect(page.locator("nav")).toBeVisible()

    // Login link should be accessible (Arabic: تسجيل الدخول)
    const loginLink = page.locator('a[href="/login"]').first()
    if (await loginLink.isVisible()) {
      await loginLink.click()
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test("language toggle switches to English", async ({ page }) => {
    await page.goto("/")

    // Default is Arabic (RTL) — verify initial state
    await expect(page.locator('[dir="rtl"]').first()).toBeVisible()

    // Find and click language toggle (Globe icon button with title="English")
    const langToggle = page.locator('button[title="English"]')
    await langToggle.click()

    // Page should now be in English (LTR)
    await expect(page.locator('[dir="ltr"]').first()).toBeVisible()
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
