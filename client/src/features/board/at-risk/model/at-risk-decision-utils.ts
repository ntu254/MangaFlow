import {
  AT_RISK_DECISIONS,
  AT_RISK_DECISION_EFFECT,
  AT_RISK_DECISION_LABEL,
  isAtRiskDecisionKind,
  requiresAtRiskDecisionReason as requiresReason,
  type AtRiskDecisionKind,
} from "@/entities/board/model/board-types";

export type VisualAtRiskDecision = AtRiskDecisionKind;

export const VISUAL_AT_RISK_DECISIONS: readonly VisualAtRiskDecision[] = AT_RISK_DECISIONS;

export function getAtRiskDecisionLabel(decision: VisualAtRiskDecision): string {
  return AT_RISK_DECISION_LABEL[decision];
}

export function getAtRiskDecisionEffect(decision: VisualAtRiskDecision): string {
  return AT_RISK_DECISION_EFFECT[decision];
}

export function isAtRiskDecisionSupported(
  decision: VisualAtRiskDecision,
): decision is AtRiskDecisionKind {
  return isAtRiskDecisionKind(decision);
}

export function requiresAtRiskDecisionReason(decision: VisualAtRiskDecision): boolean {
  return requiresReason(decision);
}
