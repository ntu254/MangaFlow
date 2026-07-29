import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const MANGAKA = ["inoue@beachread.jp", "inoue@beachread.jp"] as const;
const EDITOR = ["tanaka@beachread.jp", "tanaka@beachread.jp"] as const;
const proposalTitle = "E2E Revision Lantern";
const draftTitle = "E2E Withdrawn Draft";
const sampleImage = path.resolve("public/assets/covers/onepiece.jpg");

let proposalId = "";
let draftId = "";
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

async function fillBasicPitch(page: Page, title: string) {
  await page.getByPlaceholder("e.g. Iron Coast").fill(title);
  await page
    .getByPlaceholder(/Describe the plot, main characters/)
    .fill(
      "A lighthouse apprentice discovers that every revision to an unfinished manuscript changes the memories of the surrounding harbor community.",
    );
  await page.getByRole("button", { name: "Drama", exact: true }).click();
  await page.getByText("Select target audience", { exact: true }).click();
  await page.getByRole("option", { name: "Seinen", exact: true }).click();
}

async function createSubmittedProposal(page: Page) {
  await page.goto("/app/submissions/new");
  await expect(page.getByRole("heading", { name: "New series proposal" })).toBeVisible();
  await fillBasicPitch(page, proposalTitle);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  const fileInputs = page.locator('input[type="file"]');
  await fileInputs.nth(0).setInputFiles(sampleImage);
  await expect(page.getByText("onepiece.jpg", { exact: true }).first()).toBeVisible();
  await page.getByPlaceholder("Material title").first().fill("Revision storyboard");
  await fileInputs.nth(1).setInputFiles(sampleImage);
  await expect(page.getByText("Revision storyboard", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByText("Original work confirmation", { exact: true }).click();

  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/proposals") && response.request().method() === "POST",
  );
  const submitResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/actions/SUBMIT") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Submit to editor", exact: true }).click();
  const createResponse = await createResponsePromise;
  const payload = await createResponse.json();
  expect(createResponse.status()).toBe(201);
  expect((await submitResponsePromise).status()).toBe(200);
  return String(payload.data.id);
}

test.describe.serial("proposal revision, rejection, and withdrawal", () => {
  test("Mangaka submits a proposal for the revision branch", async ({ page }) => {
    await login(page, ...MANGAKA);
    proposalId = await createSubmittedProposal(page);
    expect(proposalId).not.toBe("");
    await expect(page).toHaveURL(/\/app\/submissions$/);
    await screenshot(page, "10-proposal-revision-submitted");
  });

  test("Editor claims the proposal and requests two revision items", async ({ page }) => {
    await login(page, ...EDITOR);
    await page.goto(`/app/editor/proposals/${proposalId}`);
    await expect(page.getByRole("heading", { name: proposalTitle })).toBeVisible();

    const claimResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/CLAIM"),
    );
    await page.getByRole("button", { name: "Claim Review", exact: true }).click();
    expect((await claimResponse).status()).toBe(200);

    await page.getByRole("button", { name: "Request Revision", exact: true }).click();
    const feedback = page.getByPlaceholder("Enter detailed feedback...");
    await feedback.fill(
      "Clarify how the opening signal changes the protagonist.\nStrengthen the final hook.",
    );
    const revisionResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/REQUEST_CHANGES"),
    );
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    expect((await revisionResponse).status()).toBe(200);
    await expect(page.getByText("Changes Requested", { exact: true })).toBeVisible();
    await screenshot(page, "11-editor-requested-proposal-revision");
  });

  test("Mangaka is blocked by an incomplete checklist, then resolves and resubmits", async ({
    page,
  }) => {
    await login(page, ...MANGAKA);
    await page.goto(`/app/submissions/${proposalId}`);
    await expect(page.getByText("Changes Requested", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Resubmit", exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Edit and resubmit proposal" })).toBeVisible();
    await dialog.getByRole("button", { name: "Continue", exact: true }).click();
    await dialog.getByRole("button", { name: "Continue", exact: true }).click();
    await dialog.getByRole("button", { name: "Save changes & resubmit", exact: true }).click();
    await expect(page.getByText("2 item(s) still unresolved.", { exact: true })).toBeVisible();

    const checklist = dialog.locator('section input[type="checkbox"]');
    await expect(checklist).toHaveCount(2);
    await checklist.nth(0).check();
    await checklist.nth(1).check();
    const responses = dialog.getByPlaceholder("How did you address this item...");
    await responses.nth(0).fill("Expanded the protagonist motivation in the opening synopsis.");
    await responses.nth(1).fill("Reworked the final paragraph into a stronger serial hook.");

    const resubmitResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/RESUBMIT"),
    );
    await dialog.getByRole("button", { name: "Save changes & resubmit", exact: true }).click();
    expect((await resubmitResponse).status()).toBe(200);
    await expect(dialog).toBeHidden();
    await expect(page.getByText(/Editor Reviewing/i).first()).toBeVisible();
    await screenshot(page, "12-mangaka-resubmitted-proposal");
  });

  test("Claiming Editor rejects the resubmitted proposal with a reason", async ({ page }) => {
    await login(page, ...EDITOR);
    await page.goto(`/app/editor/proposals/${proposalId}`);
    await expect(page.getByText(/Editor Reviewing/i).first()).toBeVisible();
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await page
      .getByPlaceholder("Enter detailed feedback...")
      .fill("The revised concept still does not meet the current editorial direction.");
    const rejectResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/REJECT"),
    );
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    expect((await rejectResponse).status()).toBe(200);
    await expect(page.getByText(/Rejected/i).first()).toBeVisible();
    await screenshot(page, "13-editor-rejected-resubmission");
  });

  test("Mangaka saves a separate draft and withdraws it", async ({ page }) => {
    await login(page, ...MANGAKA);
    await page.goto("/app/submissions/new");
    await fillBasicPitch(page, draftTitle);
    const createDraftResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/proposals") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    const response = await createDraftResponse;
    const payload = await response.json();
    draftId = String(payload.data.id);
    expect(response.status()).toBe(201);

    await page.goto(`/app/submissions/${draftId}`);
    await page.getByRole("button", { name: "Withdraw", exact: true }).click();
    const withdrawResponse = page.waitForResponse((item) =>
      item.url().includes("/actions/WITHDRAW"),
    );
    await page.getByRole("dialog").getByRole("button", { name: "Confirm", exact: true }).click();
    expect((await withdrawResponse).status()).toBe(200);
    await expect(page.getByText("Withdrawn", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Resubmit", exact: true })).toHaveCount(0);
    await screenshot(page, "14-mangaka-withdrew-draft");
  });
});
