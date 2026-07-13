import type { AtRiskDecisionKind } from "@/entities/board/model/board-types";

export type VisualAtRiskDecision = AtRiskDecisionKind;

export const VISUAL_AT_RISK_DECISIONS: VisualAtRiskDecision[] = ["CONTINUE", "RESCHEDULE", "HIATUS", "CANCELLED"];

export function getAtRiskDecisionLabel(decision: VisualAtRiskDecision): string {
  return decision.replace(/_/g, " ");
}

export function getAtRiskDecisionEffect(decision: VisualAtRiskDecision): string {
  switch (decision) {
    case "CONTINUE":
      return "CONTINUE -> Series remains ONGOING.";
    case "RESCHEDULE":
      return "RESCHEDULE -> Publication cadence changes.";
    case "HIATUS":
      return "HIATUS -> Series moves to HIATUS.";
    case "CANCELLED":
      return "CANCELLED -> Series moves to CANCELLED.";
  }
}

export function isAtRiskDecisionSupported(
  decision: VisualAtRiskDecision,
): decision is AtRiskDecisionKind {
  return ["CONTINUE", "RESCHEDULE", "HIATUS", "CANCELLED"].includes(decision);
}

export function requiresAtRiskDecisionReason(decision: VisualAtRiskDecision): boolean {
  return ["RESCHEDULE", "HIATUS", "CANCELLED"].includes(decision);
}
