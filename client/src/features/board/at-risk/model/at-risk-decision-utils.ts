import type { AtRiskDecisionKind } from "@/entities/board/model/board-types";

export type VisualAtRiskDecision = AtRiskDecisionKind | "REVISION_PLAN" | "MOVE_TO_MONTHLY";

export const VISUAL_AT_RISK_DECISIONS: VisualAtRiskDecision[] = [
  "CONTINUE",
  "WARNING",
  "REVISION_PLAN",
  "HIATUS",
  "CHANGE_FORMAT",
  "MOVE_TO_MONTHLY",
  "COMPLETE",
  "CANCEL",
];

export function getAtRiskDecisionLabel(decision: VisualAtRiskDecision): string {
  return decision.replace(/_/g, " ");
}

export function getAtRiskDecisionEffect(decision: VisualAtRiskDecision): string {
  switch (decision) {
    case "CONTINUE":
      return "CONTINUE -> Series remains ONGOING.";
    case "WARNING":
      return "WARNING -> Series is marked AT_RISK.";
    case "COMPLETE":
      return "COMPLETE -> Series moves to COMPLETED.";
    case "CANCEL":
      return "CANCEL -> Series moves to CANCELLED.";
    case "HIATUS":
      return "HIATUS -> Series moves to HIATUS if supported.";
    case "CHANGE_FORMAT":
      return "CHANGE_FORMAT -> Format change is recorded if supported.";
    case "MOVE_TO_MONTHLY":
      return "MOVE_TO_MONTHLY -> Publication cadence changes if supported.";
    case "REVISION_PLAN":
      return "REVISION_PLAN -> Recovery plan is requested if supported.";
  }
}

export function isAtRiskDecisionSupported(
  decision: VisualAtRiskDecision,
): decision is AtRiskDecisionKind {
  return ["CONTINUE", "WARNING", "CANCEL", "COMPLETE", "CHANGE_FORMAT", "HIATUS"].includes(
    decision,
  );
}

export function requiresAtRiskDecisionReason(decision: VisualAtRiskDecision): boolean {
  return [
    "WARNING",
    "REVISION_PLAN",
    "HIATUS",
    "CHANGE_FORMAT",
    "MOVE_TO_MONTHLY",
    "CANCEL",
  ].includes(decision);
}
