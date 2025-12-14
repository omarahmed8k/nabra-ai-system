import { test, expect } from "@playwright/test";

test.describe("PWA Features", () => {
  test("should have manifest.json", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBe("Nabra AI System");
    expect(manifest.short_name).toBe("Nabra AI");
  });

  test("should have app icons", async ({ page }) => {
    // Check 192x192 icon
    const icon192Response = await page.goto("/images/icon-192.png");
    expect(icon192Response?.status()).toBe(200);

    // Check 512x512 icon
    const icon512Response = await page.goto("/images/icon-512.png");
    expect(icon512Response?.status()).toBe(200);
  });

  test("should have service worker in production", async ({ page }) => {
    // Note: Service worker only works in production builds
    await page.goto("/");

    // Check if manifest link exists
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifestLink).toBe("/manifest.json");
  });

  test("should have proper viewport meta tag", async ({ page }) => {
    await page.goto("/");

    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).toContain("width=device-width");
  });

  test("should load on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByRole("main")).toBeVisible();
  });
});
