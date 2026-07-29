import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const CHAIR = ["board@beachread.jp", "board@beachread.jp"] as const;
const proposalId = "p-004";
const proposalTitle = "Kabuki Static";
const seededSessionId = "vs-001";
let noQuorumSessionId = "";
let diagnostics: Array<{ kind: string; message: string; url?: string; status?: number }> = [];

test.beforeEach(async ({ page }) => {
  diagnostics = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      diagnostics.push({ kind: "console", message: message.text() });
    }
  });
  page.on("pageerror", (error) => {
    diagnostics.push({ kind: "pageerror", message: error.message });
  });
  page.on("response", (response) => {
    const type = response.request().resourceType();
    if ((type === "fetch" || type === "xhr") && response.status() >= 400) {
      diagnostics.push({
        kind: "response",
        message: `${response.request().method()} ${response.status()}`,
        url: response.url(),
        status: response.status(),
      });
    }
  });
});

test.afterEach(async ({ page }, testInfo) => {
  await testInfo.attach("browser-diagnostics", {
    body: Buffer.from(JSON.stringify(diagnostics, null, 2)),
    contentType: "application/json",
  });
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({
      path: testInfo.outputPath("failure-full-page.png"),
      fullPage: true,
    });
  }
});

async function login(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login") && response.request().method() === "POST",
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  expect((await loginResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/app\/dashboard$/);
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.resolve(`artifacts/e2e-live/screenshots/${name}.png`),
    fullPage: true,
  });
}

test.describe.serial("Board session cancellation and no-quorum recovery", () => {
  test("Board Chair cancels an open session and restores its Proposal", async ({ page }) => {
    await login(page, ...CHAIR);
    await page.goto(`/app/board/sessions/${seededSessionId}`);
    await expect(page.getByRole("heading", { name: "Board review - weekly slate" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();

    const cancelResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/voting-sessions/${seededSessionId}/cancel`) &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Cancel session", exact: true }).click();
    expect((await cancelResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/app\/board\/sessions$/);

    await page.goto(`/app/board/proposals/${proposalId}`);
    await expect(page.getByRole("heading", { name: proposalTitle })).toBeVisible();
    await expect(page.getByText("Pending Board", { exact: true }).first()).toBeVisible();
    await screenshot(page, "15-board-cancel-restored-pending-board");
  });

  test("Board Chair opens a replacement session for the restored Proposal", async ({ page }) => {
    await login(page, ...CHAIR);
    await page.goto("/app/board/sessions/new");
    await expect(page.getByRole("heading", { name: "Create session" })).toBeVisible();
    await page.getByRole("button", { name: new RegExp(proposalTitle) }).click();
    await page.getByLabel("Title").fill("E2E No Quorum Recovery Session");

    const createResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/voting-sessions") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Create session", exact: true }).click();
    const response = await createResponse;
    const payload = await response.json();
    noQuorumSessionId = String(payload.data.id);
    expect(response.status()).toBe(201);
    await expect(page).toHaveURL(new RegExp(`/app/board/sessions/${noQuorumSessionId}$`));
    await expect(page.getByText(/\bOpen\b/).first()).toBeVisible();
    await screenshot(page, "16-board-replacement-session-open");
  });

  test("Board Chair closes with zero new votes and receives NO_QUORUM", async ({ page }) => {
    await login(page, ...CHAIR);
    await page.goto(`/app/board/sessions/${noQuorumSessionId}`);
    const closeResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/voting-sessions/${noQuorumSessionId}/close`) &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Close session", exact: true }).click();
    expect((await closeResponse).status()).toBe(200);
    await expect(page.getByText(/No Quorum/i).first()).toBeVisible();

    await page.goto(`/app/board/proposals/${proposalId}`);
    await expect(page.getByText("Pending Board", { exact: true }).first()).toBeVisible();
    await screenshot(page, "17-board-no-quorum-restored-pending-board");
  });
});
