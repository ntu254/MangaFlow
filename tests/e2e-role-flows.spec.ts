import { test, expect } from "@playwright/test";

test.describe("MangaFlow Role-based E2E Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Rely on the real backend API for authentication and token validation
  });

  test("1. Assistant flow: My Tasks visual status tabs and task studio details", async ({
    page,
  }) => {
    // Navigate to login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Select Assistant role and sign in
    await page.locator("button", { hasText: "Assistant" }).first().click();
    await page.waitForURL("**/app/dashboard");

    // Navigate to My Tasks
    await page.goto("/app/assistant/tasks");
    await expect(page.locator("h1", { hasText: "My tasks" })).toBeVisible();

    // Verify visual status tabs exist
    await expect(page.locator('button:has-text("Blocked")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancelled")')).toBeVisible();
    await expect(page.locator('button:has-text("Overdue")')).toBeVisible();
    await expect(page.locator('button:has-text("Reassigned")')).toBeVisible();

    // Click "Blocked" tab and select a task
    await page.click('button:has-text("Blocked")');

    // Select a task row to open the detail drawer
    await page.locator("table tbody tr").first().click();

    // Verify detail drawer is shown
    await expect(page.locator("a:has-text('Open Task Studio')")).toBeVisible();
    await expect(page.locator("span:has-text('BLOCKED')").first()).toBeVisible();
  });

  test("2. Board flow: Rankings details drawer and warnings", async ({ page }) => {
    // Navigate to login and select Board role
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: "Board" }).first().click();
    await page.waitForURL("**/app/dashboard");

    // Navigate to board rankings
    await page.goto("/app/board/rankings");
    await expect(page.locator("h1", { hasText: "Series rankings" })).toBeVisible();

    // Verify risk warning banner is visible
    await expect(page.locator("text=Bảng xếp hạng chỉ tạo tín hiệu rủi ro")).toBeVisible();

    // Verify Source column exists
    await expect(page.locator("th:has-text('Source')")).toBeVisible();

    // Click on a ranking row to open detail drawer
    await page.locator("table tbody tr").first().click();

    // Verify detail drawer contains breakdown elements
    await expect(page.locator("h4:has-text('Source Breakdown')")).toBeVisible();
    await expect(page.locator("h4:has-text('Trend & Risk Evidence')")).toBeVisible();

    // Verify no direct cancellation button is exposed (should only show safe CTAs)
    await expect(page.locator("button:has-text('Hủy tác phẩm')")).not.toBeVisible();
    await expect(page.locator("button:has-text('Cancel series')")).not.toBeVisible();
  });

  test("3. Admin flow: Users override dialog and separation warnings", async ({ page }) => {
    // Navigate to login and select Admin role
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: "Admin" }).first().click();
    await page.waitForURL("**/app/dashboard");

    // Go to admin users
    await page.goto("/app/admin/users");
    await expect(page.locator("h1", { hasText: "Users" })).toBeVisible();

    // Verify separation of duties warning is visible
    await expect(page.locator("p:has-text('Separation of Duties')")).toBeVisible();

    // Open row actions and trigger the override-gated deactivate flow.
    await page.getByRole("button", { name: "Open actions for Nakamura Hina" }).click();
    await page.getByRole("menuitem", { name: "Deactivate" }).click();

    // Verify override dialog is displayed
    await expect(page.getByRole("heading", { name: "Override Required" })).toBeVisible();
    await expect(
      page.getByPlaceholder("Explain the business reason and expected audit outcome..."),
    ).toBeVisible();

    // Close dialog
    await page.click("button:has-text('Cancel')");
  });

  test("4. Editor flow: self-approval warning block", async ({ page }) => {
    // Navigate to login and select Editor role
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: "Editor" }).first().click();
    await page.waitForURL("**/app/dashboard");

    // Navigate directly to proposal Ch. 7 review page which we mocked as self-owned
    await page.goto("/app/editor/proposals/p-007");
    await expect(page.locator("h1", { hasText: "Harbor of Bones" })).toBeVisible();

    // Verify self-approval block is present
    await expect(page.locator("p:has-text('Separation of Duties')")).toBeVisible();
    await expect(
      page.locator("text=Bạn không thể duyệt submission do chính mình nộp."),
    ).toBeVisible();
  });

  test("5. Payroll flow: split warning", async ({ page }) => {
    // Navigate to login and select Admin role
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: "Admin" }).first().click();
    await page.waitForURL("**/app/dashboard");

    // Navigate directly to Admin payroll
    await page.goto("/app/admin/payroll");

    // Verify payroll split warning is visible
    await expect(page.locator("p:has-text('Separation of Duties')")).toBeVisible();
    await expect(
      page.locator(
        "text=Người phê duyệt chất lượng bản vẽ (Mangaka/Editor) không được tự mình giải ngân",
      ),
    ).toBeVisible();
  });

  test("6. Mangaka flow: Series list and detail navigation", async ({ page }) => {
    // Navigate to login and select Mangaka role
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: "Mangaka" }).first().click();
    await page.waitForURL("**/app/dashboard");

    // Navigate to My Series page
    await page.goto("/app/series");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1", { hasText: "Series sản xuất" })).toBeVisible({
      timeout: 15000,
    });

    // Verify series cards exist and click the first one
    const seriesCardLink = page.locator("a[href*='/app/series/']").first();
    await expect(seriesCardLink).toBeVisible();
    await seriesCardLink.click();

    // Verify series detail page elements are visible
    await expect(page.getByRole("link", { name: "Tổng quan" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Chapters" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Đội ngũ" })).toBeVisible();
  });
});
