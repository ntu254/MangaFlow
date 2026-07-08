import type { AtRiskReview } from "@/entities/board/model/board-types";

export const seedAtRiskReviews: AtRiskReview[] = [
  {
    id: "risk-001",
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
  {
    id: "risk-002",
    seriesId: "p-003",
    seriesTitle: "Salt Letters",
    risk: "CRITICAL",
    reason: "Audience mismatch after revision cycle; projected serialization risk is high.",
    readerScore: 3.9,
    voteDropPct: 44,
    completionRate: 0.28,
    status: "OPEN",
    recommendedDecision: "CANCEL",
  },
];
