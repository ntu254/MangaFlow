import { AppError } from "../lib/http.js";
import type { RequestActor } from "../types.js";
import {
  ProposalModel,
  ProposalVoteModel,
  RankingModel,
  VotingSessionModel,
} from "../db/models.js";
import {
  BOARD_QUORUM,
  DEFAULT_BOARD_ELIGIBLE_VOTER_IDS,
  evaluateBoardTally,
  normalizeBoardVote,
} from "./board-governance.service.js";
import type {
  MobileWorkflowAction,
  MobileWorkflowActionDescriptor,
} from "../mobile/mobile-work-item.contract.js";

// Shared Board projections. VotingSession is the source of truth for
// electorate, quorum, snapshot, votes, status, and version. Mobile never
// recomputes quorum, tally, result, or canFinalize — this service does.

export function describeAction(input: {
  action: MobileWorkflowAction;
  enabled: boolean;
  disabledReason?: string | null;
  requiresConfirmation: boolean;
  requiresReason: boolean;
}): MobileWorkflowActionDescriptor {
  return {
    action: input.action,
    enabled: input.enabled,
    disabledReason: input.enabled ? null : (input.disabledReason ?? "Not available."),
    requiresConfirmation: input.requiresConfirmation,
    requiresReason: input.requiresReason,
  };
}

export interface BoardSessionContext {
  session: any;
  eligibleVoterIds: string[];
  quorum: number;
  votes: any[];
  tally: ReturnType<typeof evaluateBoardTally>;
  canFinalize: boolean;
  myVote: any | null;
}

export async function loadBoardSessionContext(
  actor: RequestActor,
  session: any,
): Promise<BoardSessionContext> {
  const eligibleVoterIds =
    Array.isArray(session?.eligibleVoterIds) && session.eligibleVoterIds.length > 0
      ? session.eligibleVoterIds
      : DEFAULT_BOARD_ELIGIBLE_VOTER_IDS;
  const quorum = Number(session?.quorum ?? BOARD_QUORUM);
  const rawVotes = await ProposalVoteModel.find({ sessionId: session.id }).lean();
  const votes = rawVotes
    .filter((vote: any) => eligibleVoterIds.includes(String(vote.voterId ?? vote.memberId)))
    .map(normalizeBoardVote);
  const tally = evaluateBoardTally(votes, quorum, eligibleVoterIds.length);
  const canFinalize =
    tally.approve >= quorum || tally.reject >= quorum || tally.total >= eligibleVoterIds.length;
  const myVote =
    rawVotes.find((vote: any) => String(vote.voterId ?? vote.memberId) === actor.id) ?? null;
  return { session, eligibleVoterIds, quorum, votes, tally, canFinalize, myVote };
}

function isChair(actor: RequestActor, session: any): boolean {
  return actor.isChair === true || session?.chairId === actor.id;
}

function isEligibleVoter(actor: RequestActor, context: BoardSessionContext): boolean {
  return context.eligibleVoterIds.includes(actor.id);
}

// Vote capability for an ordinary Board member.
export function boardVoteActions(
  actor: RequestActor,
  context: BoardSessionContext,
): MobileWorkflowActionDescriptor[] {
  const eligible = isEligibleVoter(actor, context);
  const alreadyVoted = context.myVote != null;
  const open = context.session.status === "OPEN";
  const disabledReason = !open
    ? "Voting is not open."
    : !eligible
      ? "You are not on this session's electorate."
      : "You have already voted in this round.";
  return [
    describeAction({
      action: "VOTE",
      enabled: open && eligible && !alreadyVoted,
      disabledReason,
      requiresConfirmation: true,
      requiresReason: false,
    }),
  ];
}

// Chair-only session lifecycle capability.
export function boardChairActions(
  actor: RequestActor,
  context: BoardSessionContext,
): MobileWorkflowActionDescriptor[] {
  if (!isChair(actor, context.session)) return [];
  const open = context.session.status === "OPEN";
  return [
    describeAction({
      action: "SESSION_FINALIZE",
      enabled: open && context.canFinalize,
      disabledReason: !open
        ? "Session is not open."
        : "Quorum or a decisive tally has not been reached yet.",
      requiresConfirmation: true,
      requiresReason: false,
    }),
    describeAction({
      action: "SESSION_CANCEL",
      enabled: open,
      disabledReason: "Only an open session can be cancelled.",
      requiresConfirmation: true,
      requiresReason: true,
    }),
  ];
}

// ---------------------------------------------------------------------------
// Detail projections
// ---------------------------------------------------------------------------

export async function getBoardSessionDetail(actor: RequestActor, sessionId: string) {
  if (actor.role !== "BOARD") {
    throw new AppError(403, "Board permission is required.", "FORBIDDEN");
  }
  const session = (await VotingSessionModel.findOne({ id: sessionId }).lean()) as any;
  if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  const context = await loadBoardSessionContext(actor, session);
  const proposal = (await ProposalModel.findOne({ id: session.proposalId }).lean()) as any;

  return {
    session: {
      id: session.id,
      title: session.title,
      status: session.status,
      version: typeof session.version === "number" ? session.version : null,
      proposalId: session.proposalId ?? null,
      reVoteOfSessionId: session.reVoteOfSessionId ?? null,
      isReVote: Boolean(session.reVoteOfSessionId),
    },
    proposal: proposal ? { id: proposal.id, title: proposal.title, status: proposal.status } : null,
    tally: {
      approve: context.tally.approve,
      reject: context.tally.reject,
      total: context.tally.total,
      quorum: context.quorum,
      eligible: context.eligibleVoterIds.length,
      canFinalize: context.canFinalize,
    },
    myVote: context.myVote ? { decision: context.myVote.decision ?? null } : null,
    actions: [...boardVoteActions(actor, context), ...boardChairActions(actor, context)],
  };
}

// Ranking is read-only on mobile; import stays web-only.
export async function getBoardRankings(actor: RequestActor) {
  if (actor.role !== "BOARD") {
    throw new AppError(403, "Board permission is required.", "FORBIDDEN");
  }
  const rankings = await RankingModel.find({}).sort({ rank: 1 }).lean();
  return {
    generatedAt: new Date().toISOString(),
    items: rankings.map((ranking: any) => ({
      id: ranking.id,
      seriesId: ranking.seriesId,
      seriesTitle: ranking.seriesTitle,
      rank: ranking.rank ?? null,
      previousRank: ranking.previousRank ?? null,
      finalScore: ranking.finalScore ?? null,
      readerScore: ranking.readerScore ?? null,
      status: ranking.status ?? null,
      atRisk: ranking.atRisk === true || ranking.status === "AT_RISK",
    })),
  };
}
