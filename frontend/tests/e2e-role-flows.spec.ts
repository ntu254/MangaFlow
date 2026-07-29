import { test, expect, type Locator, type Page } from "@playwright/test";
import type {
  ProposalVersion,
  SeriesProposal,
} from "../src/entities/proposal/model/proposal-types";
import type {
  Chapter,
  ProductionSeries,
  SeriesRanking,
} from "../src/entities/series/model/series-types";
import type { StudioTask } from "../src/entities/series/model/studio-types";
import type { AdminUser, Earning } from "../src/features/admin/_shared/api/admin-queries";

type WorkspaceRole = "admin" | "assistant" | "board" | "editor" | "mangaka";

async function seedWorkspaceRole(page: Page, role: WorkspaceRole) {
  await page.addInitScript((workspaceRole) => {
    window.localStorage.setItem(
      "beachread-api-tokens",
      JSON.stringify({ accessToken: "test-access", refreshToken: "test-refresh" }),
    );
    window.localStorage.setItem(
      "beachread-auth",
      JSON.stringify({
        state: {
          user: {
            id: `u-${workspaceRole}`,
            name:
              workspaceRole === "admin"
                ? "Hayashi Admin"
                : workspaceRole === "board"
                  ? "Board Member"
                  : workspaceRole === "mangaka"
                    ? "Inoue Mangaka"
                    : workspaceRole === "editor"
                      ? "Sato Editor"
                      : "Jun Assistant",
            email: `${workspaceRole}@beachread.jp`,
            role: workspaceRole,
          },
        },
        version: 0,
      }),
    );
  }, role);
}

const ROLE_FLOW_SERIES = {
  id: "series-001",
  slug: "harbor-of-bones",
  title: "Harbor of Bones",
  synopsis: "A coastal mystery shaped by memory and loss.",
  genres: ["Mystery", "Drama"],
  coverUrl: "",
  status: "ONGOING",
  cadence: "weekly",
  startDate: "2026-06-01T00:00:00.000Z",
  targetChapters: 12,
  authorId: "u-mangaka",
  authorName: "Inoue Mangaka",
  editorId: "u-editor",
  editorName: "Sato Editor",
  assistantIds: ["u-assistant"],
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
} satisfies ProductionSeries;

const ASSISTANT_CHAPTER = {
  id: "chapter-001",
  seriesId: ROLE_FLOW_SERIES.id,
  number: 7,
  title: "The Lighthouse",
  status: "IN_PRODUCTION",
  assigneeId: "u-assistant",
  assigneeName: "Jun Assistant",
  pages: [
    {
      id: "page-001",
      index: 1,
      fileName: "page-001.png",
      fileUrl: "",
      sizeKB: 128,
      uploadedAt: "2026-07-20T00:00:00.000Z",
    },
  ],
  reviewNotes: [],
  revisionRound: 0,
  history: [],
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
} satisfies Chapter;

const ASSISTANT_TASK = {
  id: "task-001",
  seriesId: ROLE_FLOW_SERIES.id,
  chapterId: ASSISTANT_CHAPTER.id,
  pageId: ASSISTANT_CHAPTER.pages[0].id,
  title: "Clean lighthouse background",
  type: "background",
  assigneeId: "u-assistant",
  assigneeName: "Jun Assistant",
  dueAt: "2026-08-01T00:00:00.000Z",
  priority: "high",
  instructions: "Clean the background while preserving the ink texture.",
  status: "IN_PROGRESS",
  createdAt: "2026-07-20T00:00:00.000Z",
  blocked: true,
  blockedReason: "Waiting for the revised perspective guide.",
  waitingFor: "Mangaka reference update",
} satisfies StudioTask;

const BOARD_RANKING = {
  id: "ranking-001",
  seriesId: ROLE_FLOW_SERIES.id,
  seriesTitle: ROLE_FLOW_SERIES.title,
  period: "2026-07",
  readerScore: 74,
  voteCount: 320,
  finalScore: 71,
  status: "AT_RISK",
  atRisk: true,
} satisfies SeriesRanking;

const ADMIN_USER = {
  id: "user-nakamura-hina",
  name: "Nakamura Hina",
  email: "hina.nakamura@beachread.jp",
  role: "ASSISTANT",
  active: true,
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
} satisfies AdminUser;

const ADMIN_PAYROLL = {
  id: "earning-001",
  assistantId: "u-assistant",
  period: "2026-06",
  tasksCount: 1,
  subtotal: 12000,
  bonusPenalty: 0,
  amount: 12000,
  currency: "JPY",
  status: "EARNED",
  createdAt: "2026-06-30T00:00:00.000Z",
  updatedAt: "2026-06-30T00:00:00.000Z",
  items: [],
} satisfies Earning;

const EDITOR_PROPOSAL = {
  id: "p-007",
  slug: "harbor-of-bones",
  title: "Harbor of Bones",
  authorId: "u-editor",
  authorName: "Sato Editor",
  synopsis: "A coastal mystery shaped by memory and loss.",
  genres: ["Mystery", "Drama"],
  targetAudience: "seinen",
  chaptersPlanned: 12,
  coverUrl: "",
  sampleChapterUrl: "",
  status: "PENDING_EDITOR",
  votes: [],
  history: [],
  manuscripts: [],
  materials: [],
  requestedChanges: [],
  revisionRound: 0,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
} satisfies SeriesProposal;

const EDITOR_PROPOSAL_VERSIONS: ProposalVersion[] = [];
const UNHANDLED_FIXTURE = Symbol("unhandled fixture");

function roleFlowFixture(
  role: WorkspaceRole,
  method: string,
  pathname: string,
): unknown | typeof UNHANDLED_FIXTURE {
  const requestKey = `${method} ${pathname}`;

  switch (role) {
    case "assistant":
      switch (requestKey) {
        case "GET /api/series":
          return [ROLE_FLOW_SERIES];
        case `GET /api/series/${ROLE_FLOW_SERIES.id}/chapters`:
          return [ASSISTANT_CHAPTER];
        case "GET /api/studio/tasks":
          return [ASSISTANT_TASK];
        case "GET /api/comments":
          return [];
        default:
          return UNHANDLED_FIXTURE;
      }
    case "board":
      switch (requestKey) {
        case "GET /api/rankings":
          return [BOARD_RANKING];
        case "GET /api/series":
          return [ROLE_FLOW_SERIES];
        default:
          return UNHANDLED_FIXTURE;
      }
    case "admin":
      switch (requestKey) {
        case "GET /api/admin/users":
          return [ADMIN_USER];
        case "GET /api/admin/payroll":
          return [ADMIN_PAYROLL];
        default:
          return UNHANDLED_FIXTURE;
      }
    case "editor":
      switch (requestKey) {
        case `GET /api/proposals/${EDITOR_PROPOSAL.id}`:
          return EDITOR_PROPOSAL;
        case `GET /api/proposals/${EDITOR_PROPOSAL.id}/versions`:
          return EDITOR_PROPOSAL_VERSIONS;
        default:
          return UNHANDLED_FIXTURE;
      }
    case "mangaka":
      switch (requestKey) {
        case "GET /api/proposals":
        case "GET /api/chapters":
        case "GET /api/studio/tasks":
        case "GET /api/submissions":
        case `GET /api/series/${ROLE_FLOW_SERIES.id}/chapters`:
        case `GET /api/series/${ROLE_FLOW_SERIES.id}/activity`:
        case "GET /api/comments":
          return [];
        case "GET /api/series":
          return [ROLE_FLOW_SERIES];
        default:
          return UNHANDLED_FIXTURE;
      }
  }
}

async function mockRoleFlowApi(page: Page, role: WorkspaceRole) {
  await page.route("http://localhost:3001/api/**", async (route) => {
    const request = route.request();
    const fixture = roleFlowFixture(role, request.method(), new URL(request.url()).pathname);

    if (fixture === UNHANDLED_FIXTURE) {
      await route.fulfill({
        status: 500,
        json: { success: false, message: "Unhandled E2E fixture request" },
      });
      return;
    }

    await route.fulfill({ json: { success: true, data: fixture } });
  });
}

async function mockWorkspaceDashboardData(page: Page, assistantEarnings: unknown[] = []) {
  await page.route("http://localhost:3001/api/**", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: route.request().url().endsWith("/assistant/earnings") ? assistantEarnings : [],
      },
    }),
  );
}

async function signInAsSeededRole(page: Page, role: WorkspaceRole) {
  // The Playwright web server starts the Vite app only; keep this navigation
  // smoke test deterministic by using the same seeded session contract as the
  // role-specific tests instead of depending on a live backend login.
  await seedWorkspaceRole(page, role);
  await page.goto("/app/dashboard");
}

async function expectStatTone(page: Page, scope: Locator, label: string, expectedTone: string) {
  await expect(
    scope.locator("[data-tone]").filter({ has: page.getByText(label, { exact: true }) }),
  ).toHaveAttribute("data-tone", expectedTone);
}

test("workspace and public titles stay distinct", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveTitle(/MangaFlow Studio/);

  await seedWorkspaceRole(page, "admin");
  await mockWorkspaceDashboardData(page);
  await page.goto("/app/dashboard");
  await expect(page).toHaveTitle(/MangaFlow Studio/);
  await expect(
    page.locator("aside").getByRole("link", { name: "Manga Flow", exact: true }),
  ).toBeVisible();

  await page.goto("/read");
  await expect(page).toHaveTitle(/beachRead/);
});

test("credential sign-in presents the accessible primary form", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText("MangaFlow Studio")).toBeVisible();
  await expect(page.getByText("Workspace online")).toBeVisible();
  await expect(page.getByLabel("Email address")).toHaveAttribute("type", "email");
  await expect(page.getByLabel("Password")).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Demo access" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("mobile role navigation exposes owned routes and logout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await mockWorkspaceDashboardData(page);
  await signInAsSeededRole(page, "assistant");
  await page.waitForURL("**/app/dashboard");
  const openNavigation = page.getByRole("button", { name: "Open navigation" });
  await openNavigation.click();
  const drawer = page.getByRole("dialog", { name: "Navigation" });
  await expect(page.getByRole("link", { name: "My Tasks" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Notifications" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeAttached();
  await expect(openNavigation).toBeFocused();
  await openNavigation.click();
  await page.setViewportSize({ width: 1024, height: 844 });
  await page.waitForFunction(() => !window.matchMedia("(max-width: 1023px)").matches);
  await expect(drawer).not.toBeAttached();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => window.matchMedia("(max-width: 1023px)").matches);
  const reopenedNavigation = page.getByRole("button", { name: "Open navigation" });
  await expect(reopenedNavigation).toBeVisible();
  await reopenedNavigation.click();
  await page.getByRole("link", { name: "My Tasks" }).click();
  await page.waitForURL("**/app/assistant/tasks");
  await expect(reopenedNavigation).toBeVisible();
  await reopenedNavigation.click();
  await page
    .getByRole("dialog", { name: "Navigation" })
    .getByRole("button", { name: "Logout" })
    .click();
  await page.waitForURL("**/login");
});

test.describe("MangaFlow Role-based E2E Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Rely on the real backend API for authentication and token validation
  });

  test("admin dashboard retains its governance surface", async ({ page }) => {
    await seedWorkspaceRole(page, "admin");
    await mockWorkspaceDashboardData(page);
    await page.goto("/app/dashboard");
    await expect(page.getByRole("heading", { name: "Operations control" })).toBeVisible();
    await expect(
      page.getByText(
        "System health, governance backlog, and override-sensitive operations for the MangaFlow Studio workspace.",
        { exact: true },
      ),
    ).toBeVisible();
  });

  test("board dashboard retains its queue entry point", async ({ page }) => {
    await seedWorkspaceRole(page, "board");
    await mockWorkspaceDashboardData(page);
    await page.goto("/app/dashboard");
    await expect(page.getByRole("heading", { name: "Board dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open queue" })).toBeVisible();
  });

  test("creator dashboards retain their primary workspace actions", async ({ page }) => {
    await mockWorkspaceDashboardData(page);
    await seedWorkspaceRole(page, "mangaka");
    await page.goto("/app/dashboard");
    await expect(page.getByText("Mangaka workspace")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open review queue" })).toHaveAttribute(
      "href",
      "/app/mangaka/submissions/review",
    );

    await seedWorkspaceRole(page, "assistant");
    await page.goto("/app/dashboard");
    await expect(page.getByText("Assistant workspace")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open My Tasks" })).toHaveAttribute(
      "href",
      "/app/assistant/tasks",
    );
  });

  test("creator KPI colors communicate state instead of decoration", async ({ page }) => {
    await mockWorkspaceDashboardData(page, [
      {
        id: "earning-pending",
        assistantId: "u-assistant",
        taskId: "task-pending",
        month: new Date().toISOString().slice(0, 7),
        amount: 1000,
        status: "PENDING",
      },
      {
        id: "earning-confirmed",
        assistantId: "u-assistant",
        taskId: "task-confirmed",
        month: new Date().toISOString().slice(0, 7),
        amount: 2000,
        status: "CONFIRMED",
      },
      {
        id: "earning-paid",
        assistantId: "u-assistant",
        taskId: "task-paid",
        month: new Date().toISOString().slice(0, 7),
        amount: 3000,
        status: "PAID",
      },
    ]);

    await seedWorkspaceRole(page, "mangaka");
    await page.goto("/app/dashboard");
    const mangakaDashboard = page.locator("#main-content");
    await expectStatTone(page, mangakaDashboard, "Active series", "neutral");
    await expectStatTone(page, mangakaDashboard, "Chapters in production", "neutral");
    await expectStatTone(page, mangakaDashboard, "Active tasks", "neutral");
    await expectStatTone(page, mangakaDashboard, "Needs review", "warning");

    await seedWorkspaceRole(page, "assistant");
    await page.goto("/app/dashboard");
    const earningSummary = page
      .getByRole("heading", { name: "Earning summary" })
      .locator("xpath=../../..");
    await expectStatTone(page, earningSummary, "Pending", "warning");
    await expectStatTone(page, earningSummary, "Confirmed", "neutral");
    await expectStatTone(page, earningSummary, "Paid (month)", "success");
  });

  test("editor dashboard retains its standard header and review queue action", async ({ page }) => {
    await mockWorkspaceDashboardData(page);
    await seedWorkspaceRole(page, "editor");
    await page.goto("/app/dashboard");

    await expect(page.getByRole("heading", { name: "Today, Editor" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Review Queue" })).toHaveAttribute(
      "href",
      "/app/editor/review",
    );
  });

  test("role dashboards fit their main content at mobile and desktop widths", async ({ page }) => {
    await mockWorkspaceDashboardData(page);

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(viewport);

      for (const role of ["admin", "board", "mangaka", "assistant", "editor"] as const) {
        await seedWorkspaceRole(page, role);
        await page.goto("/app/dashboard");
        await expect(page.locator("#main-content")).toBeVisible();

        const dimensions = await page.locator("#main-content").evaluate((element) => ({
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        }));

        expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
        expect(dimensions.documentScrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
      }
    }
  });

  test("1. Assistant flow: My Tasks visual status tabs and task studio details", async ({
    page,
  }) => {
    await mockRoleFlowApi(page, "assistant");
    await seedWorkspaceRole(page, "assistant");

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
    await mockRoleFlowApi(page, "board");
    await seedWorkspaceRole(page, "board");

    // Navigate to board rankings
    await page.goto("/app/board/rankings");
    await expect(page.locator("h1", { hasText: "Series rankings" })).toBeVisible();

    // Verify risk warning banner is visible
    await expect(
      page.getByText(
        "Rankings only generate risk signals and do not automatically cancel a series. All status changes must be carried out manually by the board.",
        { exact: true },
      ),
    ).toBeVisible();

    // Verify Source column exists
    await expect(page.locator("th:has-text('Source')")).toBeVisible();

    // Click on a ranking row to open detail drawer
    await page.locator("table tbody tr").first().click();

    // Verify detail drawer contains breakdown elements
    await expect(page.locator("h4:has-text('Source Breakdown')")).toBeVisible();
    await expect(page.locator("h4:has-text('Trend & Risk Evidence')")).toBeVisible();

    // Verify no direct cancellation button is exposed (should only show safe CTAs)
    await expect(page.locator("button:has-text('Cancel series')")).not.toBeVisible();
  });

  test("3. Admin flow: Users override dialog and separation warnings", async ({ page }) => {
    await mockRoleFlowApi(page, "admin");
    await seedWorkspaceRole(page, "admin");

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
      page.getByPlaceholder("Explain the business reason and expected governance outcome..."),
    ).toBeVisible();

    // Close dialog
    await page.click("button:has-text('Cancel')");
  });

  test("4. Editor flow: self-approval warning block", async ({ page }) => {
    await mockRoleFlowApi(page, "editor");
    await seedWorkspaceRole(page, "editor");

    // Navigate directly to proposal Ch. 7 review page which we mocked as self-owned
    await page.goto("/app/editor/proposals/p-007");
    await expect(page.locator("h1", { hasText: "Harbor of Bones" })).toBeVisible();

    // Verify self-approval block is present
    await expect(page.locator("p:has-text('Separation of Duties')")).toBeVisible();
    await expect(
      page.getByText("You cannot approve a submission you created.", { exact: true }),
    ).toBeVisible();
  });

  // Payroll admin flow removed (CT-11 / FLOW-GAP-04): the `/app/admin/payroll` page and
  // its backend routes were deleted, so the former "Payroll flow: split warning" E2E case
  // no longer applies.

  test("6. Mangaka flow: Series list and detail navigation", async ({ page }) => {
    await mockRoleFlowApi(page, "mangaka");
    await seedWorkspaceRole(page, "mangaka");

    // Navigate to My Series page
    await page.goto("/app/series");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1", { hasText: "Series register" })).toBeVisible({
      timeout: 15000,
    });

    // Verify series cards exist and click the first one
    const seriesCardLink = page.locator("a[href*='/app/series/']").first();
    await expect(seriesCardLink).toBeVisible();
    await seriesCardLink.click();

    // Verify series detail page elements are visible
    await expect(page.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Chapters" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Team" })).toBeVisible();
  });
});
