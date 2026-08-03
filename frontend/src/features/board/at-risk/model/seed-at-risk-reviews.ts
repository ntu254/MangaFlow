import type { AtRiskReview } from "@/entities/board/model/board-types";

export const seedAtRiskReviews: AtRiskReview[] = [
  {
    id: "risk-001",
    rankingId: "rank-002",
    seriesId: "s-vinland-prod",
    seriesTitle: "Vinland: New Horizon",
    period: "2026-W26",
    risk: "HIGH",
    reason: "Imported ranking flagged this series for period 2026-W26. Final score: 4.0.",
    readerScore: 4.2,
    finalScore: 4.0,
    voteCount: 5400,
    source: "CSV_IMPORT",
    status: "OPEN",
    recommendedDecision: "WARNING",
  },
];
