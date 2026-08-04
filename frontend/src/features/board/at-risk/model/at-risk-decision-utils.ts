import {
  AT_RISK_DECISION_LABEL,
  type AtRiskDecisionKind,
} from "@/entities/board/model/board-types";

export type VisualAtRiskDecision =
  Extract<AtRiskDecisionKind, "CONTINUE" | "WARNING" | "CHANGE_FORMAT" | "CANCEL">;

export const VISUAL_AT_RISK_DECISIONS: VisualAtRiskDecision[] = [
  "CONTINUE",
  "WARNING",
  "CHANGE_FORMAT",
  "CANCEL",
];

export function getAtRiskDecisionLabel(decision: VisualAtRiskDecision): string {
  return AT_RISK_DECISION_LABEL[decision];
}

export function getAtRiskDecisionEffect(decision: VisualAtRiskDecision): string {
  switch (decision) {
    case "CONTINUE":
      return "Series remains active; the decision is recorded for audit.";
    case "WARNING":
      return "Records a warning for the flagged series; no automatic status change is made.";
    case "CHANGE_FORMAT":
      return "Updates the series publication cadence immediately.";
    case "CANCEL":
      return "Archives the series, removes it from public view (UNLISTED), and cancels all scheduled publications. A reason is required.";
  }
}

export function isAtRiskDecisionSupported(
  decision: AtRiskDecisionKind | VisualAtRiskDecision | undefined,
): decision is VisualAtRiskDecision {
  return Boolean(decision && VISUAL_AT_RISK_DECISIONS.includes(decision as VisualAtRiskDecision));
}

export function requiresAtRiskDecisionReason(decision: VisualAtRiskDecision): boolean {
  return ["WARNING", "CANCEL", "CHANGE_FORMAT"].includes(decision);
}
