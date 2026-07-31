import type {
  AtRiskReview,
  AtRiskDecisionKind,
  RiskLevel,
} from "@/entities/board/model/board-types";
import type { SeriesRanking } from "@/entities/series";

const DECISIONS: AtRiskDecisionKind[] = [
  "CONTINUE",
  "WARNING",
  "REQUEST_IMPROVEMENT_PLAN",
  "CANCEL",
  "COMPLETE",
  "CHANGE_FORMAT",
  "HIATUS",
];

function isDecision(value: unknown): value is AtRiskDecisionKind {
  return typeof value === "string" && DECISIONS.includes(value as AtRiskDecisionKind);
}

function riskFromScore(score: number): RiskLevel {
  return score < 3.5 ? "CRITICAL" : "HIGH";
}

export function isRankingAtRisk(ranking: SeriesRanking) {
  return ranking.atRisk === true || ranking.status === "AT_RISK";
}

export function mapRankingToAtRiskReview(ranking: SeriesRanking): AtRiskReview {
  const score = ranking.finalScore ?? ranking.readerScore ?? 0;
  const storedDecision = ranking.metadata?.atRiskDecision;
  const decision = isDecision(storedDecision?.decision) ? storedDecision.decision : undefined;
  const status = decision ? "DECIDED" : "OPEN";

  return {
    id: `risk:${ranking.id}`,
    rankingId: ranking.id,
    seriesId: ranking.seriesId,
    seriesTitle: ranking.seriesTitle,
    period: ranking.period,
    risk: riskFromScore(score),
    reason: `Imported ranking flagged this series for period ${ranking.period}. Final score: ${score.toFixed(1)}.`,
    readerScore: ranking.readerScore ?? score,
    finalScore: score,
    voteCount: ranking.voteCount ?? 0,
    source: ranking.source,
    status,
    recommendedDecision: score < 3.5 ? "CANCEL" : "WARNING",
    decision,
    decisionReason: storedDecision?.note,
    decidedAt: storedDecision?.decidedAt,
    decidedByName: storedDecision?.decidedByName,
  };
}
