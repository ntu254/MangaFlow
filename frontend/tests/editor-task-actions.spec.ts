import { expect, test, type Page } from "@playwright/test";

const EDITOR = {
  id: "u-editor",
  name: "Sato Editor",
  email: "editor@beachread.jp",
  role: "editor",
};

const SERIES = {
  id: "series-001",
  slug: "harbor-of-bones",
  title: "Harbor of Bones",
  synopsis: "A coastal mystery.",
  genres: ["Mystery"],
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
};

const CHAPTER = {
  id: "chapter-001",
  seriesId: "series-001",
  number: 7,
  title: "The Lighthouse",
  status: "TANTOU_REVIEW",
  assigneeId: "u-mangaka",
  assigneeName: "Inoue Mangaka",
  pages: [
    {
      id: "page-001",
      index: 1,
      fileName: "page-001.png",
      fileUrl: "metadata://local/page-001.png",
      sizeKB: 128,
      status: "UPLOADED",
      uploadedAt: "2026-07-20T00:00:00.000Z",
    },
  ],
  reviewNotes: [],
  revisionRound: 0,
  history: [],
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
};

const TASK_APPROVED = {
  id: "task-001",
  seriesId: "series-001",
  chapterId: "chapter-001",
  pageId: "page-001",
  title: "Clean lighthouse background",
  type: "background",
  assigneeId: "u-assistant",
  assigneeName: "Jun Assistant",
  dueAt: "2026-08-01T00:00:00.000Z",
  priority: "high",
  instructions: "Clean the background while preserving the ink texture.",
  status: "MANGAKA_APPROVED",
  createdAt: "2026-07-20T00:00:00.000Z",
};

async function seedEditor(page: Page) {
  await page.addInitScript((user) => {
    window.localStorage.setItem(
      "beachread-api-tokens",
      JSON.stringify({ accessToken: "test-access", refreshToken: "test-refresh" }),
    );
    window.localStorage.setItem("beachread-auth", JSON.stringify({ state: { user }, version: 0 }));
  }, EDITOR);
}

test("editor approves and completes a MANGAKA_APPROVED task from the chapter review page", async ({
  page,
}) => {
  await seedEditor(page);
  let tasks = [TASK_APPROVED];

  await page.route("**/api/series/series-001", (route) =>
    route.fulfill({ json: { success: true, data: SERIES } }),
  );
  await page.route("**/api/chapters/chapter-001/reviews", (route) =>
    route.fulfill({ json: { success: true, data: [] } }),
  );
  await page.route("**/api/comments?*", (route) =>
    route.fulfill({ json: { success: true, data: [] } }),
  );
  await page.route("**/api/studio/regions?*", (route) =>
    route.fulfill({ json: { success: true, data: [] } }),
  );
  await page.route("**/api/studio/tasks?*", (route) =>
    route.fulfill({ json: { success: true, data: tasks } }),
  );
  await page.route("**/api/chapters/chapter-001", (route) =>
    route.fulfill({ json: { success: true, data: CHAPTER } }),
  );

  const editorApproveRequest = page.waitForRequest((request) =>
    request.url().endsWith("/api/studio/tasks/task-001/actions/EDITOR_APPROVE"),
  );
  const completeRequest = page.waitForRequest((request) =>
    request.url().endsWith("/api/studio/tasks/task-001/actions/COMPLETE"),
  );
  await page.route("**/api/studio/tasks/task-001/actions/*", (route) => {
    const url = route.request().url();
    const action = url.endsWith("/COMPLETE") ? "COMPLETE" : "EDITOR_APPROVE";
    tasks = [
      {
        ...TASK_APPROVED,
        status: action === "COMPLETE" ? "COMPLETED" : "EDITOR_APPROVED",
      },
    ];
    route.fulfill({
      json: { success: true, data: { id: "task-001", status: tasks[0].status } },
    });
  });

  await page.goto("/app/editor/chapters/chapter-001/review");

  await expect(page.getByText("Assistant tasks")).toBeVisible();
  await expect(page.getByText("Clean lighthouse background", { exact: true })).toBeVisible();
  await expect(page.getByText("tracking only — not a payment").first()).toBeVisible();

  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await editorApproveRequest;
  await expect(page.getByRole("button", { name: "Complete", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Complete", exact: true }).click();
  await completeRequest;
  await expect(page.getByRole("button", { name: "Complete", exact: true })).toHaveCount(0);
  await expect(page.getByText("COMPLETED").first()).toBeVisible();
});
