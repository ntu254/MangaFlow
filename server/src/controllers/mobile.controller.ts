import { asyncRoute, ok, AppError } from "../lib/http.js";
import { ProposalModel } from "../db/models.js";
import { audit, notify } from "../services/audit.service.js";
import {
  editorReviewQueue,
  boardQueue,
  applyProposalAction,
  evaluateBoardTally,
  normalizeBoardVote
} from "../services/workflow.service.js";
import { requireActor } from "./helpers.js";
import { requireRole, requireBoardChair } from "../middleware/auth.js";
import type { AuthedRequest } from "../types.js";

export const editorReviewQueueHandler = asyncRoute(async (_req: AuthedRequest, res) => ok(res, await editorReviewQueue()));
export const boardQueueHandler = asyncRoute(async (_req: AuthedRequest, res) => ok(res, await boardQueue()));

export const getBoardVotes = asyncRoute(async (req: AuthedRequest, res) => {
  const proposal = await ProposalModel.findOne({ id: String(req.params.seriesId) }).lean();
  if (!proposal) throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");
  const votes = ((proposal as any).votes ?? []).map(normalizeBoardVote);
  ok(res, { seriesId: String(req.params.seriesId), votes, tally: evaluateBoardTally(votes), status: (proposal as any).status });
});

export const startReview = asyncRoute(async (req: AuthedRequest, res) => ok(res, await applyProposalAction(req, String(req.params.seriesId), "CLAIM", req.body)));
export const requestRevision = asyncRoute(async (req: AuthedRequest, res) => ok(res, await applyProposalAction(req, String(req.params.seriesId), "REQUEST_CHANGES", req.body)));
export const rejectSeries = asyncRoute(async (req: AuthedRequest, res) => ok(res, await applyProposalAction(req, String(req.params.seriesId), "REJECT", { ...req.body, comment: req.body?.rejectReason })));
export const forwardToBoard = asyncRoute(async (req: AuthedRequest, res) => ok(res, await applyProposalAction(req, String(req.params.seriesId), "FORWARD", req.body)));
export const castVote = asyncRoute(async (req: AuthedRequest, res) => ok(res, await applyProposalAction(req, String(req.params.seriesId), "VOTE", req.body)));
export const finalizeDecision = asyncRoute(async (req: AuthedRequest, res) => ok(res, await applyProposalAction(req, String(req.params.seriesId), "FORCE_STATUS", { forceStatus: req.body?.decision === "REJECTED" ? "REJECTED" : "APPROVED", comment: req.body?.note, publicationType: req.body?.publicationType })));
export const tieBreakDecision = asyncRoute(async (req: AuthedRequest, res) => ok(res, await applyProposalAction(req, String(req.params.seriesId), "VOTE", req.body)));

export const atRiskDecision = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  await audit(req, "ranking.at_risk_decision", "series", seriesId, { decision: req.body?.decision, note: req.body?.note });
  await notify("u-editor", "ranking.at_risk_decision", `Board recorded ${req.body?.decision ?? "decision"} for ${seriesId}.`);
  ok(res, { seriesId, decision: req.body?.decision ?? "CONTINUE" });
});
