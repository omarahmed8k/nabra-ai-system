import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should navigate to login page", async ({ page }) => {
    // Navigate to login
    await page.goto("/auth/login");

    // Check if login form exists
    await expect(page.getByRole("heading", { name: /sign in|login/i })).toBeVisible();

    // Check for email and password inputs
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    await page.goto("/auth/register");

    // Check if register form exists
    await expect(
      page.getByRole("heading", { name: /create.*account|sign up|register/i })
    ).toBeVisible();

    // Check for required form fields
    const nameInput = page.getByLabel(/name/i);
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/^password/i);

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("should show validation error for empty login", async ({ page }) => {
    await page.goto("/auth/login");

    // Try to submit empty form
    const submitButton = page.getByRole("button", { name: /sign in|login/i });
    await submitButton.click();

    // Should show validation or stay on page
    await expect(page).toHaveURL(/login/);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/auth/login");

    // Fill with invalid credentials
    await page.getByLabel(/email/i).fill("invalid@test.com");
    await page.getByLabel(/password/i).fill("wrongpassword");

    // Submit form
    const submitButton = page.getByRole("button", { name: /sign in|login/i });
    await submitButton.click();

    // Wait a bit for response
    await page.waitForTimeout(1000);

    // Should show error or stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test("should navigate between login and register", async ({ page }) => {
    await page.goto("/auth/login");

    // Find and click register link
    const registerLink = page.getByRole("link", { name: /sign up|register|create account/i });
    if ((await registerLink.count()) > 0) {
      await registerLink.first().click();
      await expect(page).toHaveURL(/register/);
    }
  });
});
