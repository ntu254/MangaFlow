import { rankingKeys, seriesKeys } from "@/entities/series";
import { boardKeys } from "../api/board-queries";

/**
 * Pure query-key sets for Board mutation cache invalidation.
 *
 * Kept as plain functions (no QueryClient dependency) so the frontend contract
 * tests can assert that every mutation refreshes the views it touches without
 * a manual page refresh.
 */

export function atRiskDecisionInvalidations(seriesId: string) {
  return [
    boardKeys.all,
    rankingKeys.list(),
    seriesKeys.detail(seriesId),
    seriesKeys.chapters(seriesId),
    seriesKeys.mine(),
  ] as const;
}

export function rankingImportInvalidations() {
  return [
    rankingKeys.all,
    [...rankingKeys.all, "periods"],
    [...boardKeys.all, "decisions"],
    [...boardKeys.all, "queue"],
  ] as const;
}
