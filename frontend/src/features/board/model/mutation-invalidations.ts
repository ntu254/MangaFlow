import { seriesKeys } from "@/entities/series/model/series-types";
import { rankingKeys } from "@/entities/series/model/ranking-queries";

/**
 * Pure query-key sets for Board mutation cache invalidation.
 *
 * Kept as plain functions (no QueryClient dependency) so the frontend contract
 * tests can assert that every mutation refreshes the views it touches without
 * a manual page refresh.
 */

// Mirrors boardKeys in features/board/api/board-queries.ts without importing
// it, to avoid pulling the app query layer into contract tests.
const boardKeys = {
  all: ["board"] as const,
  queue: () => [...boardKeys.all, "queue"] as const,
  decisions: () => [...boardKeys.all, "decisions"] as const,
};

// Mirrors submissionKeys.editorReviewQueue / mangakaReviewQueue in
// features/series/api/series-queries.ts without importing it.
const submissionQueueKeys = {
  editorReviewQueue: () => ["submissions", "editorReviewQueue"] as const,
  mangakaReviewQueue: (filters?: Record<string, unknown>) =>
    ["submissions", "mangakaReviewQueue", filters ?? {}] as const,
};

export function atRiskDecisionInvalidations(seriesId: string) {
  return [
    boardKeys.all,
    rankingKeys.list(),
    seriesKeys.detail(seriesId),
    seriesKeys.chapters(seriesId),
    seriesKeys.mine(),
    submissionQueueKeys.editorReviewQueue(),
    submissionQueueKeys.mangakaReviewQueue(),
  ] as const;
}

export function rankingImportInvalidations() {
  return [
    rankingKeys.all,
    [...rankingKeys.all, "periods"],
    seriesKeys.all,
    boardKeys.decisions(),
    boardKeys.queue(),
  ] as const;
}
