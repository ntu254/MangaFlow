import { asyncRoute, ok, AppError } from "../lib/http.js";
import {
  ProposalModel,
  ProposalVoteModel,
  RankingModel,
  VotingSessionModel,
} from "../db/models.js";
import { audit, notify } from "../services/audit.service.js";
import { assertCanReadProposal } from "../services/authorization.service.js";
import {
  editorReviewQueue,
  boardQueue,
  applyProposalAction,
} from "../services/workflow.service.js";
import { closeVotingSession } from "../services/proposal-governance.service.js";
import {
  BOARD_QUORUM,
  DEFAULT_BOARD_ELIGIBLE_VOTER_IDS,
  evaluateBoardTally,
  normalizeBoardVote,
} from "../services/board-governance.service.js";
import { requireActor } from "./helpers.js";
import { requireRole, requireBoardChair } from "../middleware/auth.js";
import type { AuthedRequest } from "../types.js";

export const editorReviewQueueHandler = asyncRoute(async (_req: AuthedRequest, res) =>
  ok(res, await editorReviewQueue()),
);
export const boardQueueHandler = asyncRoute(async (_req: AuthedRequest, res) =>
  ok(res, await boardQueue()),
);

export const getBoardVotes = asyncRoute(async (req: AuthedRequest, res) => {
  const proposal = await ProposalModel.findOne({ id: String(req.params.seriesId) }).lean();
  if (!proposal) throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");
  await assertCanReadProposal(requireActor(req), proposal);
  const session = await VotingSessionModel.findOne({
    targetType: "PROPOSAL",
    proposalId: String(req.params.seriesId),
    status: { $in: ["OPEN", "TIE_BREAK_REQUIRED"] },
  }).lean();
  const eligibleVoterIds =
    Array.isArray((session as any)?.eligibleVoterIds) &&
    (session as any).eligibleVoterIds.length > 0
      ? (session as any).eligibleVoterIds
      : DEFAULT_BOARD_ELIGIBLE_VOTER_IDS;
  const rawVotes = (
    session
      ? await ProposalVoteModel.find({ sessionId: (session as any).id }).lean()
      : ((proposal as any).votes ?? [])
  ).filter((vote: any) => eligibleVoterIds.includes(String(vote.voterId ?? vote.memberId)));
  const votes = rawVotes.map(normalizeBoardVote);
  const quorum = Number((session as any)?.quorum ?? BOARD_QUORUM);
  ok(res, {
    seriesId: String(req.params.seriesId),
    votingSessionId: (session as any)?.id ?? (proposal as any).activeVotingSessionId ?? null,
    proposalVersionId:
      (session as any)?.proposalVersionId ?? (proposal as any).activeProposalVersionId ?? null,
    expectedVersion: (session as any)?.version ?? null,
    votes,
    tally: evaluateBoardTally(votes, quorum, eligibleVoterIds.length),
    quorum,
    eligibleVoterIds,
    status: (session as any)?.status ?? (proposal as any).status,
  });
});

export const startReview = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await applyProposalAction(req, String(req.params.seriesId), "CLAIM", req.body)),
);
export const requestRevision = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await applyProposalAction(req, String(req.params.seriesId), "REQUEST_CHANGES", req.body)),
);
export const rejectSeries = asyncRoute(async (req: AuthedRequest, res) =>
  ok(
    res,
    await applyProposalAction(req, String(req.params.seriesId), "REJECT", {
      ...req.body,
      comment: req.body?.rejectReason,
    }),
  ),
);
export const forwardToBoard = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await applyProposalAction(req, String(req.params.seriesId), "FORWARD", req.body)),
);
export const castVote = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await applyProposalAction(req, String(req.params.seriesId), "VOTE", req.body)),
);
export const finalizeDecision = asyncRoute(async (req: AuthedRequest, res) => {
  const sessionId = String(req.body?.sessionId ?? "");
  if (!sessionId) {
    throw new AppError(
      400,
      "sessionId is required to finalize a Board decision.",
      "VALIDATION_ERROR",
    );
  }
  ok(res, await closeVotingSession(req, sessionId, req.body?.note, req.body?.publicationType));
});
export const tieBreakDecision = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await applyProposalAction(req, String(req.params.seriesId), "VOTE", req.body)),
);

export const atRiskDecision = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  const rankingId = String(req.body?.rankingId ?? "").trim();
  const decision = String(req.body?.decision ?? "").trim();
  if (!rankingId || !decision) {
    throw new AppError(400, "rankingId and decision are required.", "VALIDATION_ERROR");
  }
  const ranking = await RankingModel.findOne({ id: rankingId });
  if (!ranking) throw new AppError(404, "Ranking not found.", "RANKING_NOT_FOUND");
  if (ranking.seriesId !== seriesId) {
    throw new AppError(409, "Ranking does not belong to this series.", "RANKING_SERIES_MISMATCH");
  }
  if (ranking.atRisk !== true && ranking.status !== "AT_RISK") {
    throw new AppError(409, "Ranking is not at risk.", "RANKING_NOT_AT_RISK");
  }
  const actor = requireActor(req);
  const atRiskDecision = {
    decision,
    note: req.body?.note,
    decidedById: actor.id,
    decidedByName: actor.name,
    decidedAt: new Date(),
  };
  await RankingModel.updateOne(
    { id: rankingId },
    { $set: { "metadata.atRiskDecision": atRiskDecision } },
  );
  await audit(req, "ranking.at_risk_decision", "series", seriesId, {
    rankingId,
    decision,
    note: req.body?.note,
  });
  await notify(
    "u-editor",
    "ranking.at_risk_decision",
    `Board recorded ${decision} for ${seriesId}.`,
  );
  ok(res, { seriesId, rankingId, decision });
});
