import { expect, test } from "@playwright/test";
import {
  pageAssignmentInvalidations,
  studioTaskActionInvalidations,
  submissionReviewInvalidations,
} from "../src/features/series/model/mutation-invalidations";
import {
  atRiskDecisionInvalidations,
  rankingImportInvalidations,
} from "../src/features/board/model/mutation-invalidations";

/**
 * Cache invalidation contracts.
 *
 * After every mutation (approve/reject/request-revision, task accept/start/
 * submit, page assignment accept/release, at-risk CANCEL, ranking import) the
 * affected views must be invalidated so the UI updates without a manual
 * refresh. These tests pin the exact query-key sets the mutations invalidate.
 */

function includesKey(keys: readonly unknown[], needle: readonly unknown[]): boolean {
  return keys.some((key) => JSON.stringify(key) === JSON.stringify(needle));
}

test.describe("Studio mutation cache invalidation", () => {
  test("submission review refreshes submission, studio, chapter, and series views", () => {
    const keys = submissionReviewInvalidations({
      submissionId: "sub-1",
      taskId: "task-1",
      chapterId: "chapter-1",
      seriesId: "series-1",
    });
    expect(keys).toContainEqual(["submissions"]);
    expect(keys).toContainEqual(["studio"]);
    expect(includesKey(keys, ["studio", "task", "task-1"])).toBe(true);
    expect(includesKey(keys, ["submissions", "detail", "sub-1"])).toBe(true);
    expect(includesKey(keys, ["submissions", "byTask", "task-1"])).toBe(true);
    expect(includesKey(keys, ["submissions", "task", "task-1"])).toBe(true);
    expect(includesKey(keys, ["series", "detail", "series-1", "chapters"])).toBe(true);
    expect(includesKey(keys, ["chapters", "detail", "chapter-1"])).toBe(true);
    expect(includesKey(keys, ["chapters", "detail", "chapter-1", "readiness"])).toBe(true);
    expect(includesKey(keys, ["chapters", "detail", "chapter-1", "pages"])).toBe(true);
  });

  test("task accept/start/submit refreshes the studio task and readiness", () => {
    const keys = studioTaskActionInvalidations("task-1", "chapter-1");
    expect(keys).toContainEqual(["studio"]);
    expect(includesKey(keys, ["studio", "task", "task-1"])).toBe(true);
    expect(includesKey(keys, ["chapters", "detail", "chapter-1", "readiness"])).toBe(true);
  });

  test("page assignment accept/release refreshes studio and chapter views", () => {
    const keys = pageAssignmentInvalidations({ chapterId: "chapter-1", seriesId: "series-1" });
    expect(keys).toContainEqual(["studio"]);
    expect(includesKey(keys, ["chapters", "detail", "chapter-1"])).toBe(true);
    expect(includesKey(keys, ["chapters", "detail", "chapter-1", "readiness"])).toBe(true);
    expect(includesKey(keys, ["chapters", "detail", "chapter-1", "pages"])).toBe(true);
    expect(includesKey(keys, ["series", "detail", "series-1", "chapters"])).toBe(true);
  });

  test("task action without ids still refreshes the studio list", () => {
    const keys = studioTaskActionInvalidations();
    expect(keys).toContainEqual(["studio"]);
  });
});

test.describe("Board mutation cache invalidation", () => {
  test("at-risk decision refreshes board queue, ranking list, series, and chapters", () => {
    const keys = atRiskDecisionInvalidations("series-1");
    expect(keys).toContainEqual(["board"]);
    expect(includesKey(keys, ["rankings", "list"])).toBe(true);
    expect(includesKey(keys, ["series", "detail", "series-1"])).toBe(true);
    expect(includesKey(keys, ["series", "detail", "series-1", "chapters"])).toBe(true);
    expect(includesKey(keys, ["series", "mine"])).toBe(true);
    expect(includesKey(keys, ["submissions", "editorReviewQueue"])).toBe(true);
    expect(includesKey(keys, ["submissions", "mangakaReviewQueue", {}])).toBe(true);
  });

  test("ranking import refreshes ranking list, periods, series, and the board queue", () => {
    const keys = rankingImportInvalidations();
    expect(keys).toContainEqual(["rankings"]);
    expect(includesKey(keys, ["rankings", "periods"])).toBe(true);
    expect(keys).toContainEqual(["series"]);
    expect(includesKey(keys, ["board", "queue"])).toBe(true);
    expect(includesKey(keys, ["board", "decisions"])).toBe(true);
  });
});
