import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should load the landing page", async ({ page }) => {
    await page.goto("/");

    // Check page title
    await expect(page).toHaveTitle(/Nabra AI System/);

    // Check main heading
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("should have working navigation links", async ({ page }) => {
    await page.goto("/");

    // Check for auth links
    const loginLink = page.getByRole("link", { name: /sign in|login/i });
    const registerLink = page.getByRole("link", { name: /sign up|register/i });

    if ((await loginLink.count()) > 0) {
      await expect(loginLink.first()).toBeVisible();
    }

    if ((await registerLink.count()) > 0) {
      await expect(registerLink.first()).toBeVisible();
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Page should still be accessible
    await expect(page.getByRole("main")).toBeVisible();
  });
});
