export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AtRiskDecisionKind = "CONTINUE" | "RESCHEDULE" | "HIATUS" | "CANCELLED";
export type RankingPeriodStatus = "DRAFT" | "IMPORTED" | "VALIDATED" | "FINALIZED";
export type RankingTrend = "UP" | "DOWN" | "FLAT";

export type RankingPeriod = {
  id: string;
  label: string;
  issue: string;
  status: RankingPeriodStatus;
  importedAt?: string;
  finalizedAt?: string;
};

export type RankingRow = {
  id: string;
  periodId: string;
  rank: number;
  previousRank: number;
  seriesId: string;
  seriesTitle: string;
  score: number;
  votes: number;
  views: number;
  completionRate: number;
  trend: RankingTrend;
  risk: RiskLevel;
  source?: string;
  editorNote?: string;
  performanceSnapshot?: string;
  sourceBreakdown?: string;
  trendRiskEvidence?: string;
};

export type RankingImportJob = {
  id: string;
  periodId: string;
  fileName: string;
  status: "PENDING" | "VALIDATED" | "FAILED" | "FINALIZED";
  rowCount: number;
  errors: string[];
  createdAt: string;
};

export type AtRiskReview = {
  id: string;
  seriesId: string;
  seriesTitle: string;
  risk: RiskLevel;
  reason: string;
  readerScore: number;
  voteDropPct: number;
  completionRate: number;
  status: "OPEN" | "DECIDED";
  recommendedDecision: AtRiskDecisionKind;
  decision?: AtRiskDecisionKind;
  decisionReason?: string;
  decidedAt?: string;
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const AT_RISK_DECISION_LABEL: Record<AtRiskDecisionKind, string> = {
  CONTINUE: "Continue",
  RESCHEDULE: "Reschedule",
  HIATUS: "Hiatus",
  CANCELLED: "Cancelled",
};

export const AT_RISK_DECISIONS = [
  "CONTINUE",
  "RESCHEDULE",
  "HIATUS",
  "CANCELLED",
] as const satisfies readonly AtRiskDecisionKind[];

export const AT_RISK_DECISION_EFFECT: Record<AtRiskDecisionKind, string> = {
  CONTINUE: "Series continues with current cadence.",
  RESCHEDULE: "Board changes the publication cadence.",
  HIATUS: "Series is paused and new chapter creation stops.",
  CANCELLED: "Series is cancelled and production is closed.",
};

export function isAtRiskDecisionKind(value: string): value is AtRiskDecisionKind {
  return AT_RISK_DECISIONS.includes(value as AtRiskDecisionKind);
}

export function requiresAtRiskDecisionReason(decision: AtRiskDecisionKind): boolean {
  return decision === "RESCHEDULE" || decision === "HIATUS" || decision === "CANCELLED";
}
