import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {

  test("Landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=RedoAI").or(page.locator("text=Redo"))).toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("Login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type=email]").or(page.locator("input[name=email]"))).toBeVisible();
    await expect(page.locator("button[type=submit]")).toBeVisible();
  });

  test("Recommender page redirects unauthenticated", async ({ page }) => {
    await page.goto("/recommender");
    await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
  });

  test("Wardrobe page redirects unauthenticated", async ({ page }) => {
    await page.goto("/wardrobe");
    await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
  });

  test("Login form has required fields", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator("input[type=email]");
    const passwordInput = page.locator("input[type=password]");
    const submitBtn = page.locator("button[type=submit]");

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    await emailInput.fill("test@example.com");
    await passwordInput.fill("password123");
    await expect(submitBtn).toBeEnabled();
  });
});
