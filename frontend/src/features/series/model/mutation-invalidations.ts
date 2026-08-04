import { chapterKeys, seriesKeys, studioKeys } from "@/entities/series/model/series-types";

/**
 * Pure query-key sets for Studio mutation cache invalidation.
 *
 * Kept as plain functions (no QueryClient dependency) so the frontend contract
 * tests can assert that every mutation refreshes the views it touches without
 * a manual page refresh.
 */

// Mirrors submissionKeys in features/series/api/series-queries.ts without
// importing it, to avoid a features <-> model import cycle.
const submissionKeys = {
  all: ["submissions"] as const,
  task: (taskId: string) => ["submissions", "task", taskId] as const,
  detail: (submissionId: string) => ["submissions", "detail", submissionId] as const,
  byTask: (taskId: string) => ["submissions", "byTask", taskId] as const,
};

export interface SubmissionReviewScope {
  submissionId?: string;
  taskId?: string;
  chapterId?: string;
  seriesId?: string;
}

export function submissionReviewInvalidations(scope: SubmissionReviewScope) {
  const keys: unknown[] = [submissionKeys.all, studioKeys.all];
  if (scope.submissionId) {
    keys.push(submissionKeys.detail(scope.submissionId));
  }
  if (scope.taskId) {
    keys.push(submissionKeys.byTask(scope.taskId));
    keys.push(submissionKeys.task(scope.taskId));
    keys.push(studioKeys.task(scope.taskId));
  }
  if (scope.chapterId) {
    keys.push(chapterKeys.detail(scope.chapterId));
    keys.push(chapterKeys.readiness(scope.chapterId));
    keys.push(chapterKeys.pages(scope.chapterId));
  }
  if (scope.seriesId) {
    keys.push(seriesKeys.chapters(scope.seriesId));
  }
  return keys;
}

export function studioTaskActionInvalidations(taskId?: string, chapterId?: string) {
  const keys: unknown[] = [studioKeys.all];
  if (taskId) {
    keys.push(studioKeys.task(taskId));
  }
  if (chapterId) {
    keys.push(chapterKeys.readiness(chapterId));
  }
  return keys;
}

export interface PageAssignmentScope {
  chapterId?: string;
  seriesId?: string;
}

export function pageAssignmentInvalidations(scope: PageAssignmentScope) {
  const keys: unknown[] = [studioKeys.all];
  if (scope.chapterId) {
    keys.push(chapterKeys.detail(scope.chapterId));
    keys.push(chapterKeys.readiness(scope.chapterId));
    keys.push(chapterKeys.pages(scope.chapterId));
  }
  if (scope.seriesId) {
    keys.push(seriesKeys.chapters(scope.seriesId));
  }
  return keys;
}
