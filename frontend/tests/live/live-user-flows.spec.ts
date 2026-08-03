import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SEEDED = {
  admin: ["admin@beachread.jp", "admin@beachread.jp"],
  mangaka: ["inoue@beachread.jp", "inoue@beachread.jp"],
  assistant: ["jun@beachread.jp", "jun@beachread.jp"],
  editor: ["tanaka@beachread.jp", "tanaka@beachread.jp"],
  chair: ["board@beachread.jp", "board@beachread.jp"],
  board2: ["sato@beachread.jp", "sato@beachread.jp"],
  board3: ["kobayashi@beachread.jp", "kobayashi@beachread.jp"],
  board4: ["watanabe@beachread.jp", "watanabe@beachread.jp"],
  board5: ["mori@beachread.jp", "mori@beachread.jp"],
} as const;

const CREATED = {
  mangaka: ["E2E Mangaka", "e2e.mangaka@beachread.jp", "E2E!Pass123", "Mangaka"],
  assistant: ["E2E Assistant", "e2e.assistant@beachread.jp", "E2E!Pass123", "Assistant"],
  editor: ["E2E Editor", "e2e.editor@beachread.jp", "E2E!Pass123", "Editor"],
} as const;

const proposalTitle = "E2E Harbor Signal";
const tieProposalTitle = "E2E Split Signal";
const tieSessionTitle = "E2E Split Decision Session";
const chapterTitle = "E2E Signal Chapter";
const sampleImage = path.resolve("public/assets/covers/onepiece.jpg");
const sampleImage2 = path.resolve("public/assets/covers/berserk.jpg");
const sampleImage3 = path.resolve("public/assets/covers/vinland.jpg");
const API_ORIGIN = process.env.E2E_API_ORIGIN ?? "http://localhost:3001";

let proposalId = "";
let sessionId = "";
let seriesSlug = "";
let productionSeriesId = "";
let chapterId = "";
let tieProposalId = "";
let tieSessionId = "";
let publicationScheduledAtMs = 0;

type Diagnostic = {
  kind: "console" | "pageerror" | "response";
  message: string;
  url?: string;
  status?: number;
};

let diagnostics: Diagnostic[] = [];

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
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto("/login", { waitUntil: "networkidle" });
      const emailInput = page.getByLabel("Email address");
      const passwordInput = page.getByLabel("Password");
      await expect(emailInput).toBeEditable();
      await expect(passwordInput).toBeEditable();
      await emailInput.fill(email);
      await passwordInput.fill(password);
      await expect(emailInput).toHaveValue(email);
      await expect(passwordInput).toHaveValue(password);
      const [response] = await Promise.all([
        page.waitForResponse(
          (candidate) =>
            candidate.url().endsWith("/api/auth/login") && candidate.request().method() === "POST",
          { timeout: 15_000 },
        ),
        page.getByRole("button", { name: "Sign in", exact: true }).click(),
      ]);
      expect(response.status(), `Login failed for ${email}`).toBe(200);
      await expect(page).toHaveURL(/\/app\/dashboard$/);
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 0) continue;
    }
  }
  throw lastError;
}

async function clearSession(page: Page) {
  await page.goto("/login");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.resolve(`artifacts/e2e-live/screenshots/${name}.png`),
    fullPage: true,
  });
}

function toLocalDateTimeMinute(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

async function assertPageHealthy(page: Page, route: string) {
  const apiFailures: Diagnostic[] = [];
  const listener = (response: import("@playwright/test").Response) => {
    const type = response.request().resourceType();
    if (
      (type === "fetch" || type === "xhr") &&
      response.status() >= 400 &&
      response.url().includes("/api/")
    ) {
      apiFailures.push({
        kind: "response",
        message: `${response.request().method()} ${response.status()}`,
        status: response.status(),
        url: response.url(),
      });
    }
  };
  page.on("response", listener);
  await page.goto(route);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("body")).toBeVisible();
  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page.getByText("This page didn't load", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Page not found", { exact: true })).toHaveCount(0);
  page.off("response", listener);
  expect(apiFailures, `API failures while opening ${route}`).toEqual([]);
}

async function createAdminUser(page: Page, input: readonly [string, string, string, string]) {
  const [name, email, password, role] = input;
  await page.getByRole("button", { name: "Create User", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByLabel("Email").fill(email);
  await dialog.getByLabel("Password").fill(password);
  await dialog.getByLabel("Role").click();
  await page.getByRole("option", { name: role, exact: true }).click();
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin/users") && response.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Create User", exact: true }).click();
  return responsePromise;
}

async function createAndSubmitProposal(page: Page, title: string, materialTitle: string) {
  await page.goto("/app/submissions/new");
  await expect(page.getByRole("heading", { name: "New series proposal" })).toBeVisible();

  await page.getByPlaceholder("e.g. Iron Coast").fill(title);
  await page
    .getByPlaceholder(/Describe the plot, main characters/)
    .fill(
      "Five lighthouse keepers receive conflicting versions of the same distress signal, forcing a divided island council to choose which warning to trust.",
    );
  await page.getByRole("button", { name: "Drama", exact: true }).click();
  await page.getByText("Select target audience", { exact: true }).click();
  await page.getByRole("option", { name: "Seinen", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  const fileInputs = page.locator('input[type="file"]');
  await fileInputs.nth(0).setInputFiles(sampleImage);
  await expect(page.getByText("onepiece.jpg", { exact: true }).first()).toBeVisible();
  await page.getByPlaceholder("Material title").first().fill(materialTitle);
  await fileInputs.nth(1).setInputFiles(sampleImage);
  await expect(page.getByText(materialTitle, { exact: true })).toBeVisible();
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
  const createPayload = await createResponse.json();
  expect(createResponse.status()).toBe(201);
  expect((await submitResponsePromise).status()).toBe(200);
  await expect(page).toHaveURL(/\/app\/submissions$/);
  return String(createPayload.data.id);
}

async function completeEditorialChecklist(page: Page) {
  const uncheckedCriteria = page.locator('button[aria-pressed="false"]');
  for (let index = 0; index < 6; index += 1) {
    const updateResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/UPDATE_EDITORIAL_CHECKLIST"),
    );
    await uncheckedCriteria.first().click();
    expect((await updateResponse).status()).toBe(200);
  }
  await expect(page.locator('button[aria-pressed="false"]')).toHaveCount(0);
}

test.describe.serial("live cross-role business chain", () => {
  test("Admin logs in and provisions Mangaka, Assistant, and Editor accounts", async ({ page }) => {
    await login(page, ...SEEDED.admin);
    await screenshot(page, "01-admin-dashboard");
    await page.goto("/app/admin/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

    for (const account of Object.values(CREATED)) {
      const response = await createAdminUser(page, account);
      expect(response.status(), `Could not create ${account[3]} account`).toBe(201);
      await expect(page.getByText(account[1], { exact: true })).toBeVisible();
    }

    await screenshot(page, "02-admin-created-accounts");
  });

  test("Admin cannot create a sixth active Board seat", async ({ page }) => {
    await login(page, ...SEEDED.admin);
    await page.goto("/app/admin/users");
    const response = await createAdminUser(page, [
      "E2E Sixth Board",
      "e2e.board6@beachread.jp",
      "E2E!Pass123",
      "Board",
    ]);
    expect(response.status()).toBe(409);
    await expect(page.getByText(/active Board roster is capped at 5 members/i)).toBeVisible();
  });

  for (const [role, account] of Object.entries(CREATED)) {
    test(`new ${role} account can sign in through the credential form`, async ({ page }) => {
      await login(page, account[1], account[2]);
      await expect(page.locator("main")).toBeVisible();
      await screenshot(page, `03-created-${role}-dashboard`);
    });
  }

  test("Mangaka creates and submits a proposal with live file uploads", async ({ page }) => {
    await login(page, ...SEEDED.mangaka);
    await page.goto("/app/submissions/new");
    await expect(page.getByRole("heading", { name: "New series proposal" })).toBeVisible();

    await page.getByPlaceholder("e.g. Iron Coast").fill(proposalTitle);
    await page
      .getByPlaceholder(/Describe the plot, main characters/)
      .fill(
        "A coastal radio engineer follows a signal that predicts disappearances, forcing the entire harbor community to confront a hidden wartime relay.",
      );
    await page.getByRole("button", { name: "Drama", exact: true }).click();
    await page.getByText("Select target audience", { exact: true }).click();
    await page.getByRole("option", { name: "Seinen", exact: true }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    const fileInputs = page.locator('input[type="file"]');
    await fileInputs.nth(0).setInputFiles(sampleImage);
    await expect(page.getByText("onepiece.jpg", { exact: true }).first()).toBeVisible();
    await page.getByPlaceholder("Material title").first().fill("E2E Storyboard");
    await fileInputs.nth(1).setInputFiles(sampleImage);
    await expect(page.getByText("E2E Storyboard", { exact: true })).toBeVisible();
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
    const createPayload = await createResponse.json();
    proposalId = String(createPayload.data.id);
    expect(createResponse.status()).toBe(201);
    expect((await submitResponsePromise).status()).toBe(200);
    await expect(page).toHaveURL(/\/app\/submissions$/);
    await screenshot(page, "04-mangaka-proposal-submitted");
  });

  test("Editor claims the submitted proposal and forwards it to Board", async ({ page }) => {
    expect(proposalId).not.toBe("");
    await login(page, ...SEEDED.editor);
    await page.goto(`/app/editor/proposals/${proposalId}`);
    await expect(page.getByRole("heading", { name: proposalTitle })).toBeVisible();

    const claimResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/CLAIM"),
    );
    await page.getByRole("button", { name: "Claim Review", exact: true }).click();
    expect((await claimResponse).status()).toBe(200);
    await completeEditorialChecklist(page);
    const sendToBoard = page.getByRole("button", { name: "Send to Board", exact: true });
    await expect(sendToBoard).toBeEnabled();

    const forwardResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/FORWARD"),
    );
    await sendToBoard.click();
    expect((await forwardResponse).status()).toBe(200);
    await expect(page.getByText(/Pending Board|Board Review/i).first()).toBeVisible();
    await screenshot(page, "05-editor-forwarded-to-board");
  });

  test("Board Chair opens a live VotingSession for the proposal", async ({ page }) => {
    await login(page, ...SEEDED.chair);
    await page.goto("/app/board/sessions/new");
    await expect(page.getByRole("heading", { name: "Create session" })).toBeVisible();
    await page.getByRole("button", { name: new RegExp(proposalTitle) }).click();
    await page.getByLabel("Title").fill("E2E Harbor Board Session");
    const createSessionResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/voting-sessions") && response.request().method() === "POST",
    );
    const sessionProposalListResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/proposals") &&
        response.url().includes("BOARD_REVIEW"),
    );
    await page.getByRole("button", { name: "Create session", exact: true }).click();
    const response = await createSessionResponse;
    const payload = await response.json();
    sessionId = String(payload.data.id);
    expect(response.status()).toBe(201);
    await expect(page).toHaveURL(new RegExp(`/app/board/sessions/${sessionId}$`));
    expect((await sessionProposalListResponse).status()).toBe(200);
    await screenshot(page, "06-board-session-open");
  });

  for (const [member, credentials] of [
    ["chair", SEEDED.chair],
    ["board member 2", SEEDED.board2],
    ["board member 3", SEEDED.board3],
  ] as const) {
    test(`${member} casts an APPROVE vote through the frontend`, async ({ page }) => {
      await login(page, ...credentials);
      await page.goto(`/app/board/${proposalId}`);
      await expect(page.getByRole("heading", { name: proposalTitle })).toBeVisible();
      await page.getByRole("button", { name: "Approve", exact: true }).click();
      const voteResponse = page.waitForResponse(
        (response) => response.url().includes("/vote") && response.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Submit vote", exact: true }).click();
      expect((await voteResponse).status()).toBe(200);
      await expect(page).toHaveURL(/\/app\/board\/dashboard$/);
    });
  }

  test("Board Chair closes the session and the system provisions the Series", async ({ page }) => {
    await login(page, ...SEEDED.chair);
    await page.goto(`/app/board/${proposalId}`);
    await expect(page.getByRole("button", { name: "Close VotingSession" })).toBeVisible();
    const closeResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/voting-sessions/") && response.url().endsWith("/close"),
    );
    await page.getByRole("button", { name: "Close VotingSession" }).click();
    expect((await closeResponse).status()).toBe(200);

    await clearSession(page);
    await login(page, ...SEEDED.mangaka);
    await page.goto("/app/series");
    const seriesLink = page.locator("a").filter({ hasText: proposalTitle }).first();
    await expect(seriesLink).toBeVisible();
    const href = await seriesLink.getAttribute("href");
    expect(href).toBeTruthy();
    seriesSlug = new URL(href!, "http://localhost:3100").pathname.split("/")[3] ?? "";
    expect(seriesSlug).not.toBe("");
    await page.goto(`/app/series/${seriesSlug}/overview`);
    const startProductionResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/actions/start_production") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Start production", exact: true }).click();
    expect((await startProductionResponse).status()).toBe(200);
    await expect(page.getByText("Ongoing", { exact: true }).first()).toBeVisible();
    await screenshot(page, "07-series-auto-provisioned");
  });

  test("Mangaka creates a Chapter, uploads a page, and runs live AI detect + whitening", async ({
    page,
  }) => {
    await login(page, ...SEEDED.mangaka);
    if (!seriesSlug) {
      await page.goto("/app/series");
      const seriesLink = page.locator("a").filter({ hasText: proposalTitle }).first();
      await expect(seriesLink).toBeVisible();
      const href = await seriesLink.getAttribute("href");
      seriesSlug = new URL(href!, "http://localhost:3100").pathname.split("/")[3] ?? "";
    }
    await page.goto(`/app/series/${seriesSlug}/chapters`);
    await expect(page.getByRole("button", { name: /^Create (first )?chapter$/ })).toHaveCount(1);
    await page.getByRole("button", { name: "Create first chapter", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Title").fill(chapterTitle);
    const chapterResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/chapters") && response.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    const chapterResponse = await chapterResponsePromise;
    const chapterPayload = await chapterResponse.json();
    chapterId = String(chapterPayload.data.id);
    productionSeriesId = String(chapterPayload.data.seriesId);
    expect(chapterResponse.status()).toBe(201);

    await page.getByText(chapterTitle, { exact: true }).click();
    await page.getByRole("button", { name: "Open Studio", exact: true }).click();
    await expect(page.getByRole("button", { name: "Upload Page", exact: true })).toBeVisible();
    const uploadResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/chapters/${chapterId}/pages`) &&
        response.request().method() === "POST",
    );
    await page.locator('input[type="file"]').first().setInputFiles(sampleImage);
    expect((await uploadResponsePromise).status()).toBe(201);

    const detectResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/ai/detect-bubbles"),
    );
    await page.getByRole("button", { name: "Detect Speech Bubbles", exact: true }).click();
    const detectResponse = await detectResponsePromise;
    expect(detectResponse.status()).toBe(200);

    const whitenResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/ai/whiten-bubbles"),
    );
    await page.getByRole("button", { name: "Text Whitening", exact: true }).click();
    expect((await whitenResponsePromise).status()).toBe(200);
    await expect(page.getByText("AI whitening output is ready.", { exact: true })).toBeVisible();
    await screenshot(page, "08-live-ai-whitening");
  });

  test("Mangaka reorders and deletes Chapter pages with order persisted after reload", async ({
    page,
  }) => {
    expect(chapterId).not.toBe("");
    await login(page, ...SEEDED.mangaka);
    await page.goto(`/app/series/${seriesSlug}/chapters`);
    await page.getByText(chapterTitle, { exact: true }).click();

    const uploadedPageResponses: number[] = [];
    const responseListener = (response: import("@playwright/test").Response) => {
      if (
        response.url().includes(`/chapters/${chapterId}/pages`) &&
        response.request().method() === "POST"
      ) {
        uploadedPageResponses.push(response.status());
      }
    };
    page.on("response", responseListener);
    const fileChooser = page.waitForEvent("filechooser");
    await page
      .locator("#chapter-pages")
      .getByRole("button", { name: "Upload", exact: true })
      .click();
    await (await fileChooser).setFiles([sampleImage2, sampleImage3]);
    await expect.poll(() => uploadedPageResponses.length, { timeout: 30_000 }).toBe(2);
    page.off("response", responseListener);
    expect(uploadedPageResponses).toEqual([201, 201]);

    const pageCards = page.locator("[data-page-id]");
    await expect(pageCards).toHaveCount(3);
    const initialOrder = await pageCards.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-page-id") ?? ""),
    );
    const movedPageId = initialOrder[2];
    expect(movedPageId).toBeTruthy();
    const movedPage = page.locator(`[data-page-id="${movedPageId}"]`);

    for (const expectedIndex of [1, 0]) {
      const reorderResponse = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/chapters/${chapterId}/pages/reorder`) &&
          response.request().method() === "PATCH",
      );
      await movedPage.getByTitle("Move left").click();
      expect((await reorderResponse).status()).toBe(200);
      await expect(pageCards.nth(expectedIndex)).toHaveAttribute("data-page-id", movedPageId);
    }

    await page.reload({ waitUntil: "networkidle" });
    await page.getByText(chapterTitle, { exact: true }).click();
    const persistedCards = page.locator("[data-page-id]");
    await expect(persistedCards).toHaveCount(3);
    await expect(persistedCards.first()).toHaveAttribute("data-page-id", movedPageId);

    const deletedPageId = await persistedCards.nth(1).getAttribute("data-page-id");
    expect(deletedPageId).toBeTruthy();
    page.once("dialog", (dialog) => dialog.accept());
    const deleteResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/pages/${deletedPageId}`) &&
        response.request().method() === "DELETE",
    );
    await page.locator(`[data-page-id="${deletedPageId}"]`).getByTitle("Delete page").click();
    expect((await deleteResponse).status()).toBe(200);

    await page.reload({ waitUntil: "networkidle" });
    await page.getByText(chapterTitle, { exact: true }).click();
    const remainingCards = page.locator("[data-page-id]");
    await expect(remainingCards).toHaveCount(2);
    await expect(remainingCards.first()).toHaveAttribute("data-page-id", movedPageId);
    await expect(remainingCards.nth(0).getByText("01", { exact: true })).toBeVisible();
    await expect(remainingCards.nth(1).getByText("02", { exact: true })).toBeVisible();
    await screenshot(page, "23-mangaka-reordered-deleted-pages");
  });

  test("Mangaka submits the new Chapter to Tantou review", async ({ page }) => {
    await login(page, ...SEEDED.mangaka);
    if (!seriesSlug) {
      await page.goto("/app/series");
      const seriesLink = page.locator("a").filter({ hasText: proposalTitle }).first();
      await expect(seriesLink).toBeVisible();
      const href = await seriesLink.getAttribute("href");
      seriesSlug = new URL(href!, "http://localhost:3100").pathname.split("/")[3] ?? "";
    }
    const chaptersResponsePromise =
      chapterId === ""
        ? page.waitForResponse(
            (response) =>
              /\/api\/series\/[^/]+\/chapters(?:\?|$)/.test(response.url()) &&
              response.request().method() === "GET",
          )
        : null;
    await page.goto(`/app/series/${seriesSlug}/chapters`);
    if (chaptersResponsePromise) {
      const chaptersPayload = await (await chaptersResponsePromise).json();
      const chapters = Array.isArray(chaptersPayload.data) ? chaptersPayload.data : [];
      const chapter = chapters.find(
        (candidate: { title?: string }) => candidate.title === chapterTitle,
      );
      chapterId = String(chapter?.id ?? "");
      productionSeriesId = String(chapter?.seriesId ?? "");
      expect(chapterId).not.toBe("");
    }
    await page.getByText(chapterTitle, { exact: true }).click();
    const sendToEditor = page.getByRole("button", {
      name: "Send to Editor Review",
      exact: true,
    });
    if ((await sendToEditor.isVisible()) && (await sendToEditor.isEnabled())) {
      const submitResponse = page.waitForResponse(
        (response) =>
          response.url().includes(`/studio/chapters/${chapterId}/send-editor-review`) &&
          response.request().method() === "POST",
      );
      await sendToEditor.click();
      expect((await submitResponse).status()).toBe(200);
    } else {
      await expect(page.getByText("Tantou Review", { exact: true }).first()).toBeVisible();
    }
  });

  test("Tantou requests a targeted Chapter revision through the review UI", async ({ page }) => {
    expect(chapterId).not.toBe("");
    await login(page, ...SEEDED.editor);
    await page.goto(`/app/editor/chapters/${chapterId}/review`);
    await page
      .getByPlaceholder("Feedback or rejection reason...")
      .fill("Tighten the speech-bubble spacing and recheck the final page composition.");
    await expect(page.getByRole("button", { name: "Request Revision" })).toBeEnabled();
    const revisionResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/REQUEST_REVISION"),
    );
    await page.getByRole("button", { name: "Request Revision" }).click();
    expect((await revisionResponse).status()).toBe(200);
    await expect(page.getByText(/Revision Required/i).first()).toBeVisible();
    await screenshot(page, "18-tantou-requested-chapter-revision");
  });

  test("Mangaka addresses the blocking note and resubmits the Chapter", async ({ page }) => {
    expect(chapterId).not.toBe("");
    expect(productionSeriesId).not.toBe("");
    await login(page, ...SEEDED.mangaka);
    await page.goto(`/app/series/${seriesSlug}/chapters`);
    await page.getByText(chapterTitle, { exact: true }).click();
    await page.getByRole("button", { name: "Open Studio", exact: true }).click();
    await page.getByRole("tab", { name: /Comments/ }).click();
    const comment = page
      .locator("li")
      .filter({ hasText: "Tighten the speech-bubble spacing" })
      .first();
    await expect(comment).toBeVisible();
    await comment.getByRole("button", { name: "Reply", exact: true }).click();
    await comment
      .getByLabel(/Reply to/)
      .fill("Updated the spacing and replaced the affected page asset.");
    const replyResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/comments/") &&
        response.url().endsWith("/replies") &&
        response.request().method() === "POST",
    );
    await comment.getByRole("button", { name: "Submit reply", exact: true }).click();
    expect((await replyResponse).status()).toBe(201);
    await expect(
      page.getByText("Updated the spacing and replaced the affected page asset.", {
        exact: true,
      }),
    ).toBeVisible();

    const addressResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/comments/") &&
        response.url().endsWith("/address") &&
        response.request().method() === "POST",
    );
    await comment.getByRole("button", { name: "Mark addressed" }).click();
    expect((await addressResponse).status()).toBe(200);
    await expect(comment.getByText("ADDRESSED", { exact: true })).toBeVisible();

    await page.goto(`/app/series/${seriesSlug}/chapters`);
    await page.getByText(chapterTitle, { exact: true }).click();
    const revisionButtons = page.getByRole("button", {
      name: "Replace revision",
      exact: true,
    });
    const revisionPageCount = await revisionButtons.count();
    expect(revisionPageCount).toBeGreaterThan(0);
    for (let remaining = revisionPageCount; remaining > 0; remaining -= 1) {
      const fileChooser = page.waitForEvent("filechooser");
      const replaceResponse = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/pages/`) && response.request().method() === "PATCH",
      );
      await revisionButtons.first().click();
      await (await fileChooser).setFiles(sampleImage);
      expect((await replaceResponse).status()).toBe(200);
      await expect(revisionButtons).toHaveCount(remaining - 1);
    }

    const resubmit = page.getByRole("button", { name: "Resubmit to Editor", exact: true });
    await expect(resubmit).toBeEnabled();
    const resubmitResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/RESUBMIT"),
    );
    await resubmit.click();
    expect((await resubmitResponse).status()).toBe(200);
    await expect(page.getByText("Tantou Review", { exact: true }).first()).toBeVisible();
    await screenshot(page, "24-mangaka-replied-addressed-comment");
  });

  test("Tantou verifies the reply and reopens the addressed Chapter comment", async ({ page }) => {
    expect(chapterId).not.toBe("");
    expect(productionSeriesId).not.toBe("");
    await login(page, ...SEEDED.editor);
    await page.goto(
      `/app/editor/series/${productionSeriesId}/studio?chapterId=${encodeURIComponent(chapterId)}`,
    );
    await page.getByRole("tab", { name: /Comments/ }).click();
    const comment = page
      .locator("li")
      .filter({ hasText: "Tighten the speech-bubble spacing" })
      .first();
    await expect(comment).toBeVisible();
    await expect(
      page.getByText("Updated the spacing and replaced the affected page asset.", {
        exact: true,
      }),
    ).toBeVisible();
    const reopenResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/comments/") &&
        response.url().endsWith("/reopen") &&
        response.request().method() === "POST",
    );
    await comment.getByRole("button", { name: "Reopen", exact: true }).click();
    expect((await reopenResponse).status()).toBe(200);
    await expect(comment.getByText("Blocking", { exact: true })).toBeVisible();
    await screenshot(page, "25-tantou-reopened-addressed-comment");
  });

  test("Mangaka addresses the reopened comment again", async ({ page }) => {
    await login(page, ...SEEDED.mangaka);
    await page.goto(`/app/series/${seriesSlug}/chapters`);
    await page.getByText(chapterTitle, { exact: true }).click();
    await page.getByRole("button", { name: "Open Studio", exact: true }).click();
    await page.getByRole("tab", { name: /Comments/ }).click();
    const comment = page
      .locator("li")
      .filter({ hasText: "Tighten the speech-bubble spacing" })
      .first();
    await expect(comment).toBeVisible();
    const addressResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/comments/") &&
        response.url().endsWith("/address") &&
        response.request().method() === "POST",
    );
    await comment.getByRole("button", { name: "Mark addressed", exact: true }).click();
    expect((await addressResponse).status()).toBe(200);
    await expect(comment.getByText("ADDRESSED", { exact: true })).toBeVisible();
  });

  test("Tantou resolves the addressed note and approves the resubmitted Chapter", async ({
    page,
  }) => {
    await login(page, ...SEEDED.editor);
    await page.goto(
      `/app/editor/series/${productionSeriesId}/studio?chapterId=${encodeURIComponent(chapterId)}`,
    );
    await page.getByRole("tab", { name: /Comments/ }).click();
    const comment = page
      .locator("li")
      .filter({ hasText: "Tighten the speech-bubble spacing" })
      .first();
    await expect(comment).toBeVisible();
    const resolveResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/comments/") &&
        response.url().endsWith("/resolve") &&
        response.request().method() === "POST",
    );
    await comment.getByRole("button", { name: "Resolve" }).click();
    expect((await resolveResponse).status()).toBe(200);
    await expect(comment.getByText("RESOLVED", { exact: true })).toBeVisible();

    await page.goto(`/app/editor/chapters/${chapterId}/review`);
    await expect(page.getByRole("button", { name: "Approve Chapter" })).toBeEnabled();
    const approveResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/EDITOR_APPROVE"),
    );
    await page.getByRole("button", { name: "Approve Chapter" }).click();
    expect((await approveResponse).status()).toBe(200);
    await expect(page.getByText(/Ready for Publication/i).first()).toBeVisible();
    await screenshot(page, "26-tantou-approved-resubmitted-chapter");
  });

  test("Tantou schedules the approved Chapter through Publications", async ({ page }) => {
    await login(page, ...SEEDED.editor);
    await page.goto("/app/editor/publications");
    await page.getByPlaceholder("Search series or chapter").fill(chapterTitle);
    const row = page.locator("tr").filter({ hasText: chapterTitle }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Schedule", exact: true }).click();

    const target = new Date();
    target.setSeconds(0, 0);
    target.setMinutes(target.getMinutes() + 1);
    if (target.getTime() - Date.now() < 20_000) target.setMinutes(target.getMinutes() + 1);
    publicationScheduledAtMs = target.getTime();

    await page.locator('input[type="datetime-local"]').fill(toLocalDateTimeMinute(target));
    const scheduleResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/SCHEDULE"),
    );
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    expect((await scheduleResponse).status()).toBe(200);
    await page.getByRole("button", { name: "Scheduled", exact: true }).click();
    await expect(page.locator("tr").filter({ hasText: chapterTitle })).toBeVisible();
    await screenshot(page, "21-tantou-scheduled-chapter");
  });

  test("Public Reader keeps a scheduled Chapter hidden before publication", async ({ page }) => {
    await clearSession(page);
    await page.goto("/read");
    await expect(
      page.getByRole("heading", { name: "Published Series", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No published series yet", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(proposalTitle, { exact: true })).toHaveCount(0);
    await screenshot(page, "27-public-reader-scheduled-hidden");
  });

  test("Tantou can publish a scheduled Chapter early", async ({ page }) => {
    expect(publicationScheduledAtMs).toBeGreaterThan(Date.now());
    await login(page, ...SEEDED.editor);
    await page.goto("/app/editor/publications");
    await page.getByRole("button", { name: "Scheduled", exact: true }).click();
    await page.getByPlaceholder("Search series or chapter").fill(chapterTitle);
    const row = page.locator("tr").filter({ hasText: chapterTitle }).first();
    await expect(row).toBeVisible();

    const earlyPublishResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/PUBLISH_EARLY"),
    );
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Publish early", exact: true }).click();
    const earlyResponse = await earlyPublishResponse;
    expect(earlyResponse.status()).toBe(200);
    await page.getByRole("button", { name: "Published", exact: true }).click();
    await expect(page.locator("tr").filter({ hasText: chapterTitle })).toBeVisible();
    await screenshot(page, "22-tantou-published-chapter");
  });

  test("Public Reader can browse and read the newly published Chapter", async ({ page }) => {
    expect(seriesSlug).not.toBe("");
    await clearSession(page);
    await page.goto("/read");
    const seriesLink = page.getByRole("link", { name: new RegExp(proposalTitle) }).first();
    await expect(seriesLink).toBeVisible();
    await seriesLink.click();

    await expect(page).toHaveURL(new RegExp(`/read/${seriesSlug}$`));
    await expect(page.getByRole("heading", { name: proposalTitle })).toBeVisible();
    const chapterLink = page.getByRole("link", {
      name: `Chapter 1: ${chapterTitle} 2 pages`,
      exact: true,
    });
    await expect(chapterLink).toBeVisible();
    await chapterLink.click();

    await expect(page).toHaveURL(new RegExp(`/read/${seriesSlug}/1$`));
    await expect(page.getByText(`Chapter 1: ${chapterTitle}`, { exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: "Page 1" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Page 2" })).toBeVisible();
    await expect(page.getByText(/will wire real images/i)).toHaveCount(0);
    await expect
      .poll(
        () =>
          page
            .getByRole("img", { name: "Page 1" })
            .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
        { message: "Waiting for the published page asset" },
      )
      .toBe(true);
    await screenshot(page, "28-public-reader-published-chapter");
  });

  test("Mangaka submits an independent proposal for the split-vote scenario", async ({ page }) => {
    await login(page, ...SEEDED.mangaka);
    tieProposalId = await createAndSubmitProposal(page, tieProposalTitle, "E2E Split Storyboard");
    expect(tieProposalId).not.toBe("");
    await screenshot(page, "11-tie-proposal-submitted");
  });

  test("Editor claims and forwards the split-vote proposal to Board", async ({ page }) => {
    expect(tieProposalId).not.toBe("");
    await login(page, ...SEEDED.editor);
    await page.goto(`/app/editor/proposals/${tieProposalId}`);
    await expect(page.getByRole("heading", { name: tieProposalTitle })).toBeVisible();

    const claimResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/CLAIM"),
    );
    await page.getByRole("button", { name: "Claim Review", exact: true }).click();
    expect((await claimResponse).status()).toBe(200);
    await completeEditorialChecklist(page);

    const forwardResponse = page.waitForResponse((response) =>
      response.url().includes("/actions/FORWARD"),
    );
    await page.getByRole("button", { name: "Send to Board", exact: true }).click();
    expect((await forwardResponse).status()).toBe(200);
    await expect(page.getByText(/Pending Board|Board Review/i).first()).toBeVisible();
  });

  test("Board Chair opens a session for the split-vote proposal", async ({ page }) => {
    await login(page, ...SEEDED.chair);
    await page.goto("/app/board/sessions/new");
    await page.getByRole("button", { name: new RegExp(tieProposalTitle) }).click();
    await page.getByLabel("Title").fill(tieSessionTitle);
    const createSessionResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/voting-sessions") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Create session", exact: true }).click();
    const response = await createSessionResponse;
    const payload = await response.json();
    tieSessionId = String(payload.data.id);
    expect(response.status()).toBe(201);
    await expect(page).toHaveURL(new RegExp(`/app/board/sessions/${tieSessionId}$`));
  });

  for (const [member, credentials, decision] of [
    ["chair", SEEDED.chair, "Approve"],
    ["board member 2", SEEDED.board2, "Approve"],
    ["board member 3", SEEDED.board3, "Reject"],
    ["board member 4", SEEDED.board4, "Reject"],
  ] as const) {
    test(`${member} casts ${decision.toUpperCase()} in the partial-vote session`, async ({
      page,
    }) => {
      await login(page, ...credentials);
      await page.goto(`/app/board/${tieProposalId}`);
      await expect(page.getByRole("heading", { name: tieProposalTitle })).toBeVisible();
      await page.getByRole("button", { name: decision, exact: true }).click();
      const voteResponse = page.waitForResponse(
        (response) => response.url().includes("/vote") && response.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Submit vote", exact: true }).click();
      expect((await voteResponse).status()).toBe(200);
      await expect(page).toHaveURL(/\/app\/board\/dashboard$/);
    });
  }

  test("Board Chair closes the partial vote without quorum", async ({ page }) => {
    await login(page, ...SEEDED.chair);
    await page.goto(`/app/board/${tieProposalId}`);
    const closeResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/voting-sessions/${tieSessionId}`) &&
        response.url().endsWith("/close") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Close VotingSession" }).click();
    const closeResponse = await closeResponsePromise;
    const closePayload = await closeResponse.json();
    expect(closeResponse.status()).toBe(200);
    expect(closePayload.data.status).toBe("NO_QUORUM");
  });

  test("Board members cannot vote after a no-quorum close", async ({ page }) => {
    await login(page, ...SEEDED.chair);
    await page.goto(`/app/board/${tieProposalId}`);
    await expect(page.getByRole("heading", { name: tieProposalTitle })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit vote", exact: true })).toHaveCount(0);
    await screenshot(page, "12-board-no-quorum-closed");
  });
});

test("Board rejects a proposal at three-of-five quorum and moves it to Decisions", async ({
  page,
}) => {
  const rejectedTitle = "E2E Rejection Signal";
  await login(page, ...SEEDED.mangaka);
  const rejectedProposalId = await createAndSubmitProposal(
    page,
    rejectedTitle,
    "E2E Rejection Reference",
  );

  await clearSession(page);
  await login(page, ...SEEDED.editor);
  await page.goto(`/app/editor/proposals/${rejectedProposalId}`);
  const claimResponse = page.waitForResponse((response) =>
    response.url().includes("/actions/CLAIM"),
  );
  await page.getByRole("button", { name: "Claim Review", exact: true }).click();
  expect((await claimResponse).status()).toBe(200);
  await completeEditorialChecklist(page);
  const forwardResponse = page.waitForResponse((response) =>
    response.url().includes("/actions/FORWARD"),
  );
  await page.getByRole("button", { name: "Send to Board", exact: true }).click();
  expect((await forwardResponse).status()).toBe(200);

  await clearSession(page);
  await login(page, ...SEEDED.chair);
  await page.goto("/app/board/sessions/new");
  await page.getByRole("button", { name: new RegExp(rejectedTitle) }).click();
  await page.getByLabel("Title").fill("E2E Rejection Decision Session");
  const createSessionResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/voting-sessions") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create session", exact: true }).click();
  const createdSession = await createSessionResponse;
  const createdSessionPayload = await createdSession.json();
  const rejectedSessionId = String(createdSessionPayload.data.id);
  expect(createdSession.status()).toBe(201);

  for (const credentials of [SEEDED.board3, SEEDED.board4, SEEDED.board5]) {
    await clearSession(page);
    await login(page, ...credentials);
    await page.goto(`/app/board/${rejectedProposalId}`);
    await expect(page.getByRole("heading", { name: rejectedTitle, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await page
      .getByPlaceholder("Add your rationale or notes for the Board...")
      .fill(`Reject vote from ${credentials[0]} after governance risk review.`);
    const voteResponse = page.waitForResponse(
      (response) => response.url().includes("/vote") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Submit vote", exact: true }).click();
    expect((await voteResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/app\/board\/dashboard$/);
    await clearSession(page);
  }

  await login(page, ...SEEDED.chair);
  await page.goto(`/app/board/${rejectedProposalId}`);
  const closeResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/voting-sessions/${rejectedSessionId}/close`) &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Close VotingSession", exact: true }).click();
  const response = await closeResponse;
  const payload = await response.json();
  expect(response.status()).toBe(200);
  expect(payload.data.status).toBe("FINALIZED");
  expect(payload.data.result).toBe("REJECTED");

  await page.goto("/app/board/queue");
  await expect(page.getByRole("button", { name: /Approved|Rejected/ })).toHaveCount(0);
  await page.goto("/app/board/decisions");
  const decisionRow = page.locator("tr").filter({ hasText: rejectedTitle }).first();
  await expect(decisionRow).toContainText(/Rejected/i);
  await screenshot(page, "29-board-rejected-decision-history");
});

test("Mangaka assigns a drawn Region, then Assistant submits and Mangaka approves", async ({
  page,
}) => {
  const regionChapterTitle = "E2E Harbor Cleanup Chapter";
  const taskTitle = "E2E Harbor Cleanup Region";
  await login(page, ...SEEDED.mangaka);
  await page.goto("/app/series/berserk-prod/chapters");
  await page.getByRole("button", { name: "Create chapter", exact: true }).click();
  const chapterDialog = page.getByRole("dialog");
  await chapterDialog.getByLabel("Title").fill(regionChapterTitle);
  const chapterResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/series/s-berserk-prod/chapters") &&
      response.request().method() === "POST",
  );
  await chapterDialog.getByRole("button", { name: "Create", exact: true }).click();
  const createdChapter = await chapterResponse;
  expect(createdChapter.status()).toBe(201);
  await page.getByText(regionChapterTitle, { exact: true }).click();
  await page.getByRole("button", { name: "Open Studio", exact: true }).click();
  await expect(page.getByRole("button", { name: "Upload Page", exact: true })).toBeVisible();
  const uploadResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/chapters/") &&
      response.url().endsWith("/pages") &&
      response.request().method() === "POST",
  );
  await page.locator('input[type="file"]').first().setInputFiles(sampleImage3);
  expect((await uploadResponse).status()).toBe(201);
  await expect(page.getByRole("button", { name: "Draw Region", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Draw Region", exact: true }).click();
  const canvas = page.locator("canvas").last();
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const createRegionResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/studio/regions") && response.request().method() === "POST",
  );
  await page.mouse.move(box!.x + box!.width * 0.42, box!.y + box!.height * 0.34);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.58, box!.y + box!.height * 0.48, { steps: 8 });
  await page.mouse.up();
  const regionResponse = await createRegionResponse;
  expect(regionResponse.status()).toBe(201);

  await page.getByRole("button", { name: "Create Assistant Task", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Create Task" });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder("Clean Background", { exact: true }).fill(taskTitle);
  await dialog.locator("select").nth(1).selectOption("u-assist");
  await dialog.locator('input[type="number"]').fill("1");
  await dialog
    .locator('input[type="date"]')
    .fill(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  await dialog
    .getByPlaceholder(/Clean background mountains and valley/)
    .fill("Clean the selected background region and preserve the panel linework.");

  const createTaskResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/studio/tasks") && response.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Create task", exact: true }).click();
  const taskResponse = await createTaskResponse;
  const taskPayload = await taskResponse.json();
  const taskId = String(taskPayload.data.id);
  expect(taskResponse.status()).toBe(201);
  await expect(page.getByText(taskTitle, { exact: true }).first()).toBeVisible();
  await screenshot(page, "32-mangaka-created-region-task");

  await clearSession(page);
  await login(page, ...SEEDED.assistant);
  await page.goto("/app/assistant/tasks");
  await expect(page.getByText(taskTitle, { exact: true }).first()).toBeVisible();
  await page.goto(`/app/assistant/tasks/${taskId}/studio`);
  await expect(page.getByRole("heading", { name: taskTitle, exact: true })).toBeVisible();

  const startResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/studio/tasks/${taskId}/actions/start`) &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Start Work", exact: true }).click();
  expect((await startResponse).status()).toBe(200);

  const submissionPanel = page
    .getByText("Upload edited file", { exact: true })
    .locator("..")
    .locator("..");
  await submissionPanel.locator('input[type="file"]').setInputFiles(sampleImage3);
  await submissionPanel
    .getByPlaceholder(/Note (?:to|for) Mangaka \(optional\)\.\.\./)
    .fill("Cleaned the assigned region and preserved the original panel texture.");

  const submitResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/tasks/${taskId}/submit`) &&
      response.request().method() === "POST",
  );
  await submissionPanel.getByRole("button", { name: "Submit Work", exact: true }).click();
  const response = await submitResponse;
  const payload = await response.json();
  const submissionId = String(payload.data.id);
  expect(response.status()).toBe(201);
  await expect(page.getByText("Work already submitted", { exact: true })).toBeVisible();
  await screenshot(page, "33-assistant-submitted-region-task");

  await clearSession(page);
  await login(page, ...SEEDED.mangaka);
  await page.goto("/app/mangaka/submissions/review");
  const reviewRow = page.locator("tr").filter({ hasText: taskTitle }).first();
  await expect(reviewRow).toBeVisible();
  await reviewRow.getByRole("link", { name: "Open Review", exact: true }).click();
  await expect(page.getByRole("heading", { name: taskTitle })).toBeVisible();

  const approveResponse = page.waitForResponse(
    (candidate) =>
      candidate.url().endsWith(`/api/submissions/${submissionId}/approve`) &&
      candidate.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  expect((await approveResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/app\/mangaka\/submissions\/review$/);
  await expect(page.locator("tr").filter({ hasText: taskTitle })).toHaveCount(0);
  await screenshot(page, "34-mangaka-approved-region-task");
});

test("Mangaka versions a Supporting Material while Editor remains read-only", async ({ page }) => {
  const materialTitle = "E2E Harbor Reference";
  await login(page, ...SEEDED.mangaka);
  await page.goto("/app/series/berserk-prod/materials");
  await page.getByRole("button", { name: "Add attachment", exact: true }).click();

  const createDialog = page.getByRole("dialog", { name: "Add supporting attachment" });
  await createDialog.getByLabel("Title").fill(materialTitle);
  await createDialog.getByLabel("Type").selectOption("reference");
  await createDialog.getByLabel("Linked chapter").selectOption("ch-s-berserk-prod-5");
  await createDialog.getByLabel("File").setInputFiles(sampleImage2);

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/materials") && response.request().method() === "POST",
  );
  await createDialog.getByRole("button", { name: "Upload", exact: true }).click();
  const created = await createResponse;
  const createdPayload = await created.json();
  const materialId = String(createdPayload.data.id);
  expect(created.status()).toBe(201);

  const materialImage = page.getByRole("img", { name: materialTitle }).first();
  await expect(materialImage).toBeVisible();
  await materialImage.click();
  let detail = page.locator("aside").filter({ hasText: materialTitle });
  await expect(detail).toBeVisible();
  await detail.getByRole("button", { name: "Replace", exact: true }).click();

  const versionDialog = page.getByRole("dialog", { name: /Upload new version/ });
  await versionDialog.getByLabel("File").setInputFiles(sampleImage3);
  await versionDialog.getByLabel("Version notes").fill("Updated reference after line review.");
  const versionResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/materials/${materialId}/versions`) &&
      response.request().method() === "POST",
  );
  await versionDialog.getByRole("button", { name: "Upload new version", exact: true }).click();
  expect((await versionResponse).status()).toBe(200);
  await expect(detail.getByText("v2", { exact: true }).first()).toBeVisible();

  await expect(detail.getByText("Status", { exact: true })).toHaveCount(0);
  await screenshot(page, "35-supporting-material-versioned");

  await clearSession(page);
  await login(page, ...SEEDED.editor);
  await page.goto("/app/series/berserk-prod/materials");
  await page.getByRole("img", { name: materialTitle }).first().click();
  detail = page.locator("aside").filter({ hasText: materialTitle });
  await expect(detail).toBeVisible();

  await expect(detail.getByRole("button", { name: "Replace", exact: true })).toHaveCount(0);
  await screenshot(page, "36-editor-readonly-supporting-material");

  const card = page
    .locator("div.group")
    .filter({ has: page.getByRole("img", { name: materialTitle }).first() })
    .first();
  await card.getByRole("button", { name: "More", exact: true }).first().click();
  await expect(page.getByRole("menuitem", { name: "Delete", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");

  const mutationAttempt = await page.evaluate(
    async ({ id, apiOrigin }) => {
      const raw = window.localStorage.getItem("beachread-api-tokens");
      const tokens = raw ? JSON.parse(raw) : null;
      const response = await fetch(`${apiOrigin}/api/materials/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Editor rewrite" }),
        headers: { Authorization: `Bearer ${tokens?.accessToken ?? ""}` },
      });
      return { status: response.status, body: await response.json() };
    },
    { id: materialId, apiOrigin: API_ORIGIN },
  );
  expect(mutationAttempt.status).toBe(403);
  await expect(page.getByRole("img", { name: materialTitle }).first()).toBeVisible();
});

const roleRoutes = [
  {
    role: "admin",
    credentials: SEEDED.admin,
    routes: [
      "/app/admin/dashboard",
      "/app/admin/users",
      "/app/admin/rates",
      "/app/admin/notifications",
    ],
  },
  {
    role: "mangaka",
    credentials: SEEDED.mangaka,
    routes: [
      "/app/dashboard",
      "/app/submissions",
      "/app/series",
      "/app/tasks",
      "/app/mangaka/submissions/review",
      "/app/rankings",
      "/app/notifications",
    ],
  },
  {
    role: "assistant",
    credentials: SEEDED.assistant,
    routes: [
      "/app/assistant/dashboard",
      "/app/assistant/tasks",
      "/app/assistant/submissions",
      "/app/assistant/earnings",
      "/app/assistant/notifications",
    ],
  },
  {
    role: "editor",
    credentials: SEEDED.editor,
    routes: [
      "/app/editor/dashboard",
      "/app/editor/review",
      "/app/editor/series",
      "/app/editor/publications",
      "/app/editor/notifications",
    ],
  },
  {
    role: "board",
    credentials: SEEDED.chair,
    routes: [
      "/app/board/dashboard",
      "/app/board/queue",
      "/app/board/sessions",
      "/app/board/rankings",
      "/app/board/at-risk",
      "/app/board/decisions",
      "/app/board/notifications",
    ],
  },
] as const;

test.describe("live role route coverage", () => {
  for (const role of roleRoutes) {
    test(`${role.role} can open all scoped routes without API failures`, async ({ page }) => {
      await login(page, ...role.credentials);
      for (const route of role.routes) {
        await assertPageHealthy(page, route);
        const routeName = route.replace(/^\/app\/?/, "").replaceAll("/", "-") || "dashboard";
        await screenshot(page, `10-${role.role}-${routeName}`);
      }
    });
  }
});

test("AI service is reachable through the authenticated frontend backend contract", async ({
  page,
}) => {
  await login(page, ...SEEDED.mangaka);
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/ai/health"),
  );
  const result = await page.evaluate(async (apiOrigin) => {
    const raw = window.localStorage.getItem("beachread-api-tokens");
    const tokens = raw ? JSON.parse(raw) : null;
    const response = await fetch(`${apiOrigin}/api/ai/health`, {
      headers: { Authorization: `Bearer ${tokens?.accessToken ?? ""}` },
    });
    return { status: response.status, body: await response.json() };
  }, API_ORIGIN);
  await responsePromise;
  expect(result.status).toBe(200);
  expect(result.body.data.status).toBe("ok");
  expect(result.body.data.upstream.model_loaded).toBe(true);
});
