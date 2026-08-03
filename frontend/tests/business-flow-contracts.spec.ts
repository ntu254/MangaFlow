import { expect, test } from "@playwright/test";
import { mapApiMaterialToSeriesMaterial } from "../src/entities/proposal/model/map-material";
import type {
  Chapter,
  MaterialItem,
  ProductionSeries,
} from "../src/entities/series/model/series-types";
import type { StudioTask } from "../src/entities/series/model/studio-types";
import type { User } from "../src/shared/auth/auth-store";
import { isCanonicalChapterReady } from "../src/features/series/detail/model/chapter-readiness";
import { checkChapterAction } from "../src/features/series/detail/model/chapter-machine";
import {
  getCommentManagementEndpoint,
  getCommentManagementRequest,
} from "../src/features/series/detail/model/comment-actions";
import { toSeriesMaterialApiPatch } from "../src/features/series/detail/model/series-material-patch";
import { toTaskRatePayload } from "../src/features/series/detail/model/task-payload";
import { deriveTaskStudioSubmissionState } from "../src/entities/task/model/submission-state";
import { getSafeNotificationActionUrl } from "../src/features/notifications/model/notification-action";
import {
  markNotificationArchivedInList,
  markNotificationReadInList,
} from "../src/shared/lib/notification-cache";
import {
  isRankingAtRisk,
  mapRankingToAtRiskReview,
} from "../src/features/board/at-risk/model/at-risk-review-adapter";

test.describe("canonical business-flow contracts", () => {
  test("at-risk reviews are derived from imported ranking signals", () => {
    const healthy = {
      id: "rank-healthy",
      seriesId: "series-healthy",
      seriesTitle: "Healthy Series",
      period: "2026-07",
      readerScore: 8.2,
      voteCount: 1200,
      finalScore: 8.1,
      status: "ACTIVE",
      atRisk: false,
    };
    const flagged = {
      ...healthy,
      id: "rank-flagged",
      seriesId: "series-flagged",
      seriesTitle: "Flagged Series",
      readerScore: 4.2,
      finalScore: 4.0,
      voteCount: 540,
      status: "AT_RISK",
      atRisk: true,
    };

    expect(isRankingAtRisk(healthy)).toBe(false);
    expect(isRankingAtRisk(flagged)).toBe(true);
    expect(mapRankingToAtRiskReview(flagged)).toMatchObject({
      rankingId: "rank-flagged",
      seriesTitle: "Flagged Series",
      period: "2026-07",
      finalScore: 4,
      voteCount: 540,
      status: "OPEN",
      risk: "HIGH",
    });
  });

  test("chapter readiness is backend-owned", () => {
    expect(isCanonicalChapterReady({ ready: true })).toBe(true);
    expect(isCanonicalChapterReady({ ready: false })).toBe(false);
    expect(isCanonicalChapterReady(undefined)).toBe(false);
  });

  test("chapter readiness does not recreate deadline or assignee blockers", () => {
    expect(
      isCanonicalChapterReady({
        ready: true,
        items: [{ key: "studio-comments", passed: true }],
      }),
    ).toBe(true);
    expect(
      isCanonicalChapterReady({
        ready: false,
        items: [
          {
            key: "studio-comments",
            passed: false,
            reason: "Unresolved blocking StudioComment",
          },
        ],
      }),
    ).toBe(false);
  });

  test("chapter submit and resubmit require the owning Mangaka", () => {
    const series = { status: "ONGOING", authorId: "owner" } as unknown as ProductionSeries;
    const chapter = {
      status: "IN_PRODUCTION",
      pages: [{ fileKey: "page-1" }],
      assigneeId: "assigned-non-owner",
    } as unknown as Chapter;
    const assignedNonOwner = { role: "mangaka", id: "assigned-non-owner" } as unknown as User;
    const owner = { role: "mangaka", id: "owner" } as unknown as User;

    expect(checkChapterAction("SUBMIT_REVIEW", assignedNonOwner, chapter, series).ok).toBe(false);
    expect(checkChapterAction("SUBMIT_REVIEW", owner, chapter, series).ok).toBe(true);

    expect(
      checkChapterAction(
        "RESUBMIT",
        assignedNonOwner,
        { ...chapter, status: "REVISION_REQUIRED" },
        series,
      ).ok,
    ).toBe(false);
    expect(
      checkChapterAction("RESUBMIT", owner, { ...chapter, status: "REVISION_REQUIRED" }, series).ok,
    ).toBe(true);
  });

  test("comment resolve and reopen use canonical endpoints", () => {
    expect(getCommentManagementEndpoint("comment-1", "OPEN")).toBe("/comments/comment-1/resolve");
    expect(getCommentManagementEndpoint("comment-1", "ADDRESSED")).toBe(
      "/comments/comment-1/reopen",
    );
    expect(getCommentManagementEndpoint("comment-1", "REOPENED")).toBe(
      "/comments/comment-1/resolve",
    );
    expect(getCommentManagementEndpoint("comment-1", "OPEN")).not.toContain("PATCH");
    expect(getCommentManagementRequest("comment-1", "OPEN")).toEqual({
      method: "POST",
      path: "/comments/comment-1/resolve",
      body: {},
    });
    expect(getCommentManagementRequest("comment-1", "RESOLVED")).toEqual({
      method: "POST",
      path: "/comments/comment-1/reopen",
      body: {},
    });
  });

  test("readiness ignores non-canonical deadline and assignee fields", () => {
    expect(
      isCanonicalChapterReady({
        ready: true,
        items: [
          { key: "deadline", passed: false },
          { key: "assignee", passed: false },
        ],
      }),
    ).toBe(true);
  });

  test("material mapping prefers top-level ACTIVE and APPROVED status", () => {
    const base = {
      id: "material-1",
      seriesId: "series-1",
      title: "Reference",
      kind: "reference",
      metadata: { status: "DRAFT" },
      versions: [],
      createdAt: "2026-07-26T00:00:00.000Z",
      updatedAt: "2026-07-26T00:00:00.000Z",
    } satisfies MaterialItem;
    expect(mapApiMaterialToSeriesMaterial({ ...base, status: "ACTIVE" }).status).toBe("ACTIVE");
    expect(mapApiMaterialToSeriesMaterial({ ...base, status: "APPROVED" }).status).toBe("APPROVED");
  });

  test("material status patch is top-level and note remains metadata", () => {
    expect(toSeriesMaterialApiPatch({ status: "ACTIVE", note: "Approved reference" })).toEqual({
      title: undefined,
      status: "ACTIVE",
      tags: undefined,
      chapterId: undefined,
      metadata: { note: "Approved reference" },
    });
    expect(toSeriesMaterialApiPatch({ status: "APPROVED" })).not.toHaveProperty("metadata.status");
  });

  test("task creation sends a rate code and quantity at the top level", () => {
    expect(toTaskRatePayload({ rateCode: "SPEECH_BUBBLE", quantity: 2 })).toEqual({
      rateCode: "SPEECH_BUBBLE",
      quantity: 2,
    });
    expect(toTaskRatePayload({ rateCode: "APPROVED", quantity: 1 })).not.toHaveProperty(
      "metadata.status",
    );
  });

  test("submitted Assistant work opens history and cannot be submitted again", () => {
    const submittedTask = {
      ...ASSISTANT_TASK_CONTRACT,
      status: "SUBMITTED",
    } as StudioTask;

    expect(
      deriveTaskStudioSubmissionState(submittedTask, [
        { id: "submission-1", status: "PENDING", submittedAt: "2026-07-29T08:00:00.000Z" },
      ]),
    ).toEqual({
      mode: "AWAITING_REVIEW",
      canSubmit: false,
      defaultTab: "history",
    });
  });

  test("an active submission prevents duplicate submit when task data is stale", () => {
    const staleTask = {
      ...ASSISTANT_TASK_CONTRACT,
      status: "IN_PROGRESS",
    } as StudioTask;

    expect(
      deriveTaskStudioSubmissionState(staleTask, [
        { id: "submission-1", status: "PENDING", submittedAt: "2026-07-29T08:00:00.000Z" },
      ]),
    ).toMatchObject({
      mode: "AWAITING_REVIEW",
      canSubmit: false,
      defaultTab: "history",
    });
  });

  test("notification actions reject executable URLs", () => {
    expect(getSafeNotificationActionUrl("/app/editor/publications")).toBe(
      "/app/editor/publications",
    );
    expect(getSafeNotificationActionUrl("https://docs.example.com/chapter/1")).toBe(
      "https://docs.example.com/chapter/1",
    );
    expect(getSafeNotificationActionUrl("javascript:alert(1)")).toBeUndefined();
    expect(getSafeNotificationActionUrl("data:text/html,bad")).toBeUndefined();
  });

  test("marking one notification read does not mark the rest of the inbox", () => {
    const next = markNotificationReadInList(
      [
        { id: "notification-1", message: "First", createdAt: "2026-07-29T08:00:00.000Z" },
        { id: "notification-2", message: "Second", createdAt: "2026-07-29T09:00:00.000Z" },
      ],
      "notification-1",
      "2026-07-29T10:00:00.000Z",
    );

    expect(next[0].readAt).toBe("2026-07-29T10:00:00.000Z");
    expect(next[1].readAt).toBeUndefined();
  });

  test("archiving one notification does not hide the rest of the inbox", () => {
    const next = markNotificationArchivedInList(
      [
        { id: "notification-1", message: "First", createdAt: "2026-07-29T08:00:00.000Z" },
        { id: "notification-2", message: "Second", createdAt: "2026-07-29T09:00:00.000Z" },
      ],
      "notification-1",
      "2026-07-29T10:00:00.000Z",
    );

    expect(next[0].archivedAt).toBe("2026-07-29T10:00:00.000Z");
    expect(next[1].archivedAt).toBeUndefined();
  });
});

const ASSISTANT_TASK_CONTRACT = {
  id: "task-contract",
  seriesId: "series-contract",
  chapterId: "chapter-contract",
  pageId: "page-contract",
  title: "Task Instructions",
  type: "lettering",
  assigneeId: "u-assistant",
  assigneeName: "Jun Assistant",
  dueAt: "2026-08-01T00:00:00.000Z",
  priority: "normal",
  instructions: "Follow the lettering guide.",
  status: "IN_PROGRESS",
  createdAt: "2026-07-29T00:00:00.000Z",
} satisfies StudioTask;
