import { asyncRoute, ok, AppError } from "../lib/http.js";
import {
  ProposalModel,
  ProposalVoteModel,
  VotingSessionModel,
} from "../db/models.js";
import { assertCanReadProposal } from "../services/authorization.service.js";
import {
  editorReviewQueue,
  boardQueue,
  applyProposalAction,
} from "../services/workflow.service.js";
import { closeVotingSession } from "../services/proposal-governance.service.js";
import {
  BOARD_QUORUM,
  evaluateBoardTally,
  normalizeBoardVote,
} from "../services/board-governance.service.js";
import { requireActor } from "./helpers.js";
import {
  getEditorMobileInbox,
  getBoardMobileInbox,
} from "../services/mobile-inbox.service.js";
import {
  getEditorProposalDetail,
  getEditorChapterDetail,
} from "../services/mobile-editor-detail.service.js";
import {
  getBoardSessionDetail,
  getBoardRankings,
} from "../services/mobile-board-detail.service.js";
import { recordAtRiskDecision } from "../services/at-risk-decision.service.js";
import type { AuthedRequest } from "../types.js";

export const editorReviewQueueHandler = asyncRoute(async (_req: AuthedRequest, res) =>
  ok(res, await editorReviewQueue()),
);
export const boardQueueHandler = asyncRoute(async (_req: AuthedRequest, res) =>
  ok(res, await boardQueue()),
);

export const editorInboxHandler = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await getEditorMobileInbox(requireActor(req))),
);
export const boardInboxHandler = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await getBoardMobileInbox(requireActor(req))),
);

export const editorProposalDetailHandler = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await getEditorProposalDetail(requireActor(req), String(req.params.proposalId))),
);
export const editorChapterDetailHandler = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await getEditorChapterDetail(requireActor(req), String(req.params.chapterId))),
);

export const boardSessionDetailHandler = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await getBoardSessionDetail(requireActor(req), String(req.params.sessionId))),
);
export const boardRankingsHandler = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await getBoardRankings(requireActor(req))),
);

export const getBoardVotes = asyncRoute(async (req: AuthedRequest, res) => {
  const proposal = await ProposalModel.findOne({ id: String(req.params.seriesId) }).lean();
  if (!proposal) throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");
  await assertCanReadProposal(requireActor(req), proposal);
  const session = await VotingSessionModel.findOne({
    targetType: "PROPOSAL",
    proposalId: String(req.params.seriesId),
    status: "OPEN",
  }).lean();
  const eligibleVoterIds = (session as any)?.eligibleVoterIds ?? [];
  const rawVotes = (
    session
      ? await ProposalVoteModel.find({ sessionId: (session as any).id }).lean()
      : []
  ).filter((vote: any) => eligibleVoterIds.includes(String(vote.voterId)));
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
export const releaseClaim = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await applyProposalAction(req, String(req.params.proposalId), "RELEASE_CLAIM", req.body)),
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
export const atRiskDecision = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId ?? "").trim();
  if (!seriesId) {
    throw new AppError(400, "seriesId is required.", "VALIDATION_ERROR");
  }
  ok(
    res,
    await recordAtRiskDecision(req, seriesId, {
      rankingId: req.body?.rankingId,
      decision: req.body?.decision,
      note: req.body?.note,
    }),
  );
});
