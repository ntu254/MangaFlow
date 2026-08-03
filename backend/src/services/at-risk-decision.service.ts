import { AppError } from "../lib/http.js";
import { RankingModel } from "../db/models.js";
import { audit, notify } from "./audit.service.js";
import { requireActor } from "../controllers/helpers.js";
import type { AuthedRequest } from "../types.js";

// At-risk cancellation is always a manual, audited Chair decision. This service
// is the single validated command; the controller only forwards to it.
export const AT_RISK_DECISIONS = [
  "CONTINUE",
  "WARNING",
  "REQUEST_IMPROVEMENT_PLAN",
  "CANCEL",
] as const;
export type AtRiskDecisionValue = (typeof AT_RISK_DECISIONS)[number];

export interface AtRiskDecisionInput {
  rankingId?: unknown;
  decision?: unknown;
  note?: string;
}

function isAtRiskDecision(value: string): value is AtRiskDecisionValue {
  return AT_RISK_DECISIONS.includes(value as AtRiskDecisionValue);
}

function requireBoardChair(req: AuthedRequest) {
  const actor = requireActor(req);
  if (actor.role !== "BOARD" || actor.isChair !== true) {
    throw new AppError(403, "Board chair permission is required.", "BOARD_CHAIR_REQUIRED");
  }
  return actor;
}

export async function recordAtRiskDecision(
  req: AuthedRequest,
  seriesIdInput: string,
  input: AtRiskDecisionInput,
) {
  const actor = requireBoardChair(req);
  const seriesId = String(seriesIdInput ?? "").trim();
  const rankingId = String(input.rankingId ?? "").trim();
  const decision = String(input.decision ?? "").trim();
  const note = typeof input.note === "string" ? input.note.trim() : "";

  if (!seriesId || !rankingId || !decision) {
    throw new AppError(400, "seriesId, rankingId, and decision are required.", "VALIDATION_ERROR");
  }
  if (!isAtRiskDecision(decision)) {
    throw new AppError(
      400,
      `Unsupported at-risk decision. Expected one of ${AT_RISK_DECISIONS.join(", ")}.`,
      "VALIDATION_ERROR",
    );
  }
  if (decision === "CANCEL" && !note) {
    throw new AppError(400, "A reason is required for manual cancellation.", "REASON_REQUIRED");
  }

  const ranking = await RankingModel.findOne({ id: rankingId });
  if (!ranking) throw new AppError(404, "Ranking not found.", "RANKING_NOT_FOUND");
  if (ranking.seriesId !== seriesId) {
    throw new AppError(409, "Ranking does not belong to this series.", "RANKING_SERIES_MISMATCH");
  }
  if (ranking.atRisk !== true && ranking.status !== "AT_RISK") {
    throw new AppError(409, "Ranking is not at risk.", "RANKING_NOT_AT_RISK");
  }

  const decidedAt = new Date();
  const atRiskDecision = {
    decision,
    note: note || undefined,
    decidedById: actor.id,
    decidedByName: actor.name,
    decidedAt,
  };
  await RankingModel.updateOne(
    { id: rankingId },
    { $set: { "metadata.atRiskDecision": atRiskDecision } },
  );
  await audit(req, "ranking.at_risk_decision", "series", seriesId, {
    rankingId,
    decision,
    note: note || undefined,
    decidedBy: actor.id,
    timestamp: decidedAt,
  });
  await notify("u-editor", "ranking.at_risk_decision", `Board recorded ${decision} for ${seriesId}.`);

  return { seriesId, rankingId, decision } as const;
}
