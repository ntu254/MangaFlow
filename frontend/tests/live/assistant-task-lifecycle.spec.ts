import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const ASSISTANT = ["jun@beachread.jp", "jun@beachread.jp"] as const;
const MANGAKA = ["inoue@beachread.jp", "inoue@beachread.jp"] as const;
const TASK_ID = "tsk-002";
const TASK_TITLE = "Lettering task awaiting work";
const sampleImage = path.resolve("public/assets/covers/onepiece.jpg");

let firstSubmissionId = "";
let revisedSubmissionId = "";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login") && response.request().method() === "POST",
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  expect((await responsePromise).status()).toBe(200);
  await expect(page).toHaveURL(/\/app\/dashboard$/);
}

async function openTaskStudio(page: Page) {
  await page.goto("/app/assistant/tasks");
  const row = page.getByRole("row").filter({ hasText: TASK_TITLE });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/app/assistant/tasks/${TASK_ID}/studio$`));
  await expect(page.getByRole("heading", { name: TASK_TITLE, exact: true })).toBeVisible();
}

async function submitWork(page: Page, note: string) {
  const submissionPanel = page
    .getByText("Upload edited file", { exact: true })
    .locator("..")
    .locator("..");
  await submissionPanel.locator('input[type="file"]').setInputFiles(sampleImage);
  await expect(submissionPanel.getByText("onepiece.jpg", { exact: true })).toBeVisible();
  await submissionPanel.getByPlaceholder("Note for Mangaka (optional)...").fill(note);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/tasks/${TASK_ID}/submit`) &&
      response.request().method() === "POST",
  );
  await submissionPanel.getByRole("button", { name: "Submit Work", exact: true }).click();
  const response = await responsePromise;
  expect([200, 201]).toContain(response.status());
  const payload = await response.json();
  await expect(page.getByText("Work submitted.", { exact: true })).toBeVisible();
  await expect(page.getByText("SUBMITTED", { exact: true }).first()).toBeVisible();
  return String(payload.data.id);
}

async function openMangakaReview(page: Page) {
  await page.goto("/app/mangaka/submissions/review");
  await page.getByRole("button", { name: "Flat Table View", exact: true }).click();
  const row = page
    .getByRole("row")
    .filter({ hasText: TASK_TITLE })
    .filter({ hasText: "PENDING" });
  await expect(row).toBeVisible();
  await row.getByRole("link", { name: "Open Review", exact: true }).click();
  await expect(page.getByRole("heading", { name: TASK_TITLE })).toBeVisible();
}

test.describe.serial("live Assistant task lifecycle", () => {
  test("Assistant opens an assigned task and starts work", async ({ page }) => {
    await login(page, ...ASSISTANT);
    const startResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/studio/tasks/${TASK_ID}/actions/start`) &&
        response.request().method() === "POST",
    );
    await openTaskStudio(page);
    expect((await startResponse).status()).toBe(200);
    await expect(page.getByRole("button", { name: "Start Work", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Block Task", exact: true })).toHaveCount(0);
    await page.screenshot({
      path: path.resolve("artifacts/e2e-live/screenshots/14-assistant-task-started.png"),
      fullPage: true,
    });
  });

  test("Assistant task studio exposes no block controls", async ({ page }) => {
    await login(page, ...ASSISTANT);
    await page.goto(`/app/assistant/tasks/${TASK_ID}/studio`);
    await expect(page.getByRole("button", { name: "Block Task", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Unblock Task", exact: true })).toHaveCount(0);
  });

  test("Assistant uploads and submits work for Mangaka review", async ({ page }) => {
    await login(page, "tanaka@beachread.jp", "tanaka@beachread.jp");
    const tokens = JSON.parse(
      (await page.evaluate(() => localStorage.getItem("beachread-api-tokens"))) ?? "{}",
    );
    const apiBase = process.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";
    const unlock = await page.request.post(
      `${apiBase}/chapters/ch-s-berserk-prod-5/actions/REQUEST_REVISION`,
      {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        data: {
          feedback: "Returning chapter to production so the pending lettering task can be worked.",
          targetType: "CHAPTER",
          targetId: "ch-s-berserk-prod-5",
        },
      },
    );
    expect(unlock.status()).toBe(200);
    await login(page, ...ASSISTANT);
    await page.goto(`/app/assistant/tasks/${TASK_ID}/studio`);
    firstSubmissionId = await submitWork(
      page,
      "Initial cleaned bubble export ready for Mangaka review.",
    );
    expect(firstSubmissionId).not.toBe("");
    await page.screenshot({
      path: path.resolve("artifacts/e2e-live/screenshots/15-assistant-work-submitted.png"),
      fullPage: true,
    });
  });

  test("Mangaka requests a revision with actionable feedback", async ({ page }) => {
    await login(page, ...MANGAKA);
    await openMangakaReview(page);
    const revisionResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/submissions/${firstSubmissionId}/request-revision`) &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Request Revision", exact: true }).click();
    await page
      .getByPlaceholder("Enter detailed feedback...")
      .fill("Restore the paper texture around the lower edge of the speech bubble.");
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    expect((await revisionResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/app\/mangaka\/submissions\/review$/);
  });

  test("Assistant reopens the revision and submits a corrected version", async ({ page }) => {
    await login(page, ...ASSISTANT);
    await page.goto(`/app/assistant/tasks/${TASK_ID}/studio`);
    await expect(page.getByRole("button", { name: "Reopen Task", exact: true })).toBeVisible();
    const reopenResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/studio/tasks/${TASK_ID}/actions/reopen`) &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Reopen Task", exact: true }).click();
    expect((await reopenResponse).status()).toBe(200);

    revisedSubmissionId = await submitWork(
      page,
      "Revised export restores the requested paper texture.",
    );
    expect(revisedSubmissionId).not.toBe("");
    expect(revisedSubmissionId).not.toBe(firstSubmissionId);
  });

  test("Mangaka approves the corrected submission", async ({ page }) => {
    await login(page, ...MANGAKA);
    await openMangakaReview(page);
    const approveResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/submissions/${revisedSubmissionId}/approve`) &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    expect((await approveResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/app\/mangaka\/submissions\/review$/);
  });

  test("Tantou editor approves and completes the task so the earning records", async ({
    page,
  }) => {
    await login(page, "tanaka@beachread.jp", "tanaka@beachread.jp");
    const tokens = JSON.parse(
      (await page.evaluate(() => localStorage.getItem("beachread-api-tokens"))) ?? "{}",
    );
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };
    const apiBase = process.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";
    const approve = await page.request.post(
      `${apiBase}/studio/tasks/${TASK_ID}/actions/EDITOR_APPROVE`,
      { headers },
    );
    expect(approve.status()).toBe(200);
    const complete = await page.request.post(
      `${apiBase}/studio/tasks/${TASK_ID}/actions/COMPLETE`,
      { headers },
    );
    expect(complete.status()).toBe(200);
  });

  test("Assistant sees the approved task and the earned amount in its original currency", async ({
    page,
  }) => {
    await login(page, ...ASSISTANT);
    await page.goto("/app/assistant/tasks");
    const taskRow = page.getByRole("row").filter({ hasText: TASK_TITLE });
    await expect(taskRow).toContainText("COMPLETED");

    await page.goto("/app/assistant/earnings");
    const earningRow = page.getByRole("row").filter({ hasText: TASK_TITLE });
    await expect(earningRow).toBeVisible();
    await expect(earningRow).toContainText("$25.00");
    await page.screenshot({
      path: path.resolve("artifacts/e2e-live/screenshots/16-assistant-earning-created.png"),
      fullPage: true,
    });
  });
});
