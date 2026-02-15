import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login")

    // Should see login form elements
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("login shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login")

    await page.fill('input[type="email"], input[name="email"]', "invalid@test.com")
    await page.fill('input[type="password"]', "wrongpassword")
    await page.click('button[type="submit"]')

    // Should show an error message (toast or inline)
    await expect(
      page.locator('[role="alert"], [data-sonner-toast], .text-destructive, .text-red-500').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test("login redirects to dashboard on success", async ({ page }) => {
    // Skip this test in CI without real credentials
    test.skip(!process.env.TEST_USER_EMAIL, "Requires TEST_USER_EMAIL and TEST_USER_PASSWORD")

    await page.goto("/login")

    await page.fill('input[type="email"], input[name="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')

    // Should redirect away from login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test("forgot password page renders", async ({ page }) => {
    await page.goto("/forgot-password")

    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("signup page renders correctly", async ({ page }) => {
    await page.goto("/signup")

    // Should have signup form fields
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test("protected routes redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/org")

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test("admin routes redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/admin")

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
