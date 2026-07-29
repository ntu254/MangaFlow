import type { AtRiskReview } from "@/entities/board/model/board-types";

export const seedAtRiskReviews: AtRiskReview[] = [
  {
    id: "risk-001",
    rankingId: "rank-002",
    seriesId: "s-vinland-prod",
    seriesTitle: "Vinland: New Horizon",
    risk: "HIGH",
    reason: "Reader score fell below 5.0 for two periods and completion rate dropped below 35%.",
    readerScore: 4.2,
    voteDropPct: 38,
    completionRate: 0.31,
    status: "OPEN",
    recommendedDecision: "WARNING",
  },
];
