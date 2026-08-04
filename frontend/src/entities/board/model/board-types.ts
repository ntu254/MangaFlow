export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AtRiskDecisionKind =
  | "CONTINUE"
  | "WARNING"
  | "CANCEL"
  | "CHANGE_FORMAT";
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
  rankingId: string;
  seriesId: string;
  seriesTitle: string;
  period?: string;
  risk: RiskLevel;
  reason: string;
  readerScore: number;
  finalScore?: number;
  voteCount?: number;
  source?: string;
  status: "OPEN" | "DECIDED";
  recommendedDecision?: AtRiskDecisionKind;
  decision?: AtRiskDecisionKind;
  decisionReason?: string;
  decidedAt?: string;
  decidedByName?: string;
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const AT_RISK_DECISION_LABEL: Record<AtRiskDecisionKind, string> = {
  CONTINUE: "Continue",
  WARNING: "Warning",
  CANCEL: "Cancel",
  CHANGE_FORMAT: "Change format",
};
