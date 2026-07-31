import {
  AT_RISK_DECISION_LABEL,
  type AtRiskDecisionKind,
} from "@/entities/board/model/board-types";

export type VisualAtRiskDecision =
  | Extract<AtRiskDecisionKind, "CONTINUE" | "WARNING" | "CANCEL">
  | "REQUEST_IMPROVEMENT_PLAN";

export const VISUAL_AT_RISK_DECISIONS: VisualAtRiskDecision[] = [
  "CONTINUE",
  "WARNING",
  "REQUEST_IMPROVEMENT_PLAN",
  "CANCEL",
];

export function getAtRiskDecisionLabel(decision: VisualAtRiskDecision): string {
  return decision === "REQUEST_IMPROVEMENT_PLAN"
    ? "Request improvement plan"
    : AT_RISK_DECISION_LABEL[decision];
}

export function getAtRiskDecisionEffect(decision: VisualAtRiskDecision): string {
  switch (decision) {
    case "CONTINUE":
      return "Series remains active; the decision is recorded for audit.";
    case "WARNING":
      return "Records a warning for the flagged series; no automatic status change is made.";
    case "REQUEST_IMPROVEMENT_PLAN":
      return "Records a request for an improvement plan from the series team.";
    case "CANCEL":
      return "Records a cancellation decision for follow-up; a reason is required.";
  }
}

export function isAtRiskDecisionSupported(
  decision: AtRiskDecisionKind | VisualAtRiskDecision | undefined,
): decision is VisualAtRiskDecision {
  return Boolean(decision && VISUAL_AT_RISK_DECISIONS.includes(decision as VisualAtRiskDecision));
}

export function requiresAtRiskDecisionReason(decision: VisualAtRiskDecision): boolean {
  return ["WARNING", "REQUEST_IMPROVEMENT_PLAN", "CANCEL"].includes(decision);
}
