import { applyProposalAction } from "../../../services/workflow.service.js";
import {
  BOARD_QUORUM,
  BOARD_TOTAL,
  evaluateBoardTally,
} from "../../../services/workflow.service.js";
import { ProposalModel } from "../../../db/models.js";
import {
  combineMongoFilters,
  listFiltersToMongo,
  listSearchToMongo,
  listSortToMongo,
  type ListQuery,
} from "../../../shared/contracts/list-contract.js";
import type { AuthedRequest } from "../../../types.js";

const BOARD_QUEUE_STATUSES = ["PENDING_BOARD", "BOARD_VOTING", "TIE_BREAK"] as const;

export type BoardQueueItem = {
  id: string;
  seriesId: string;
  seriesTitle: string;
  title: string;
  seriesStatus: "BOARD_REVIEW";
  decisionStatus: "PENDING" | "TIE_BREAK_REQUIRED";
  requestedPublicationType: string;
  publicationType: string;
  genres: string[];
  tags: string[];
  voteSummary: {
    APPROVE: number;
    REJECT: number;
    NEEDS_REVISION: number;
    approve: number;
    reject: number;
    needsRevision: number;
    pending: number;
    eligible: number;
    quorum: number;
    canFinalize: boolean;
  };
  eligibleBoardCount: number;
  quorum: number;
  voteCount: number;
  canFinalize: boolean;
  updatedAt?: Date;
};

export async function listBoardQueue(query?: ListQuery) {
  const baseFilter = {
    status: { $in: [...BOARD_QUEUE_STATUSES] },
  };

  if (!query) {
    const proposals = await ProposalModel.find(baseFilter).sort({ updatedAt: -1 }).lean();
    return {
      data: proposals.map(toBoardQueueItem),
      total: proposals.length,
      summary: summarizeBoardQueue(proposals.map(toBoardQueueItem)),
    };
  }

  const filter = combineMongoFilters(
    baseFilter,
    listSearchToMongo(query.q, ["title", "authorName", "synopsis"]),
    listFiltersToMongo(query.filters),
  );
  const sort = Object.keys(listSortToMongo(query.sort)).length
    ? listSortToMongo(query.sort)
    : { updatedAt: -1 as const };

  const [proposals, total, allProposals] = await Promise.all([
    ProposalModel.find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean(),
    ProposalModel.countDocuments(filter),
    ProposalModel.find(baseFilter).lean(),
  ]);

  return {
    data: proposals.map(toBoardQueueItem),
    total,
    summary: summarizeBoardQueue(allProposals.map(toBoardQueueItem)),
  };
}

function toBoardQueueItem(proposal: any): BoardQueueItem {
  const tally = evaluateBoardTally(proposal.votes ?? []);
  const canFinalize = tally.status === "APPROVED" || tally.status === "REJECTED";

  return {
    id: proposal.id,
    seriesId: proposal.id,
    seriesTitle: proposal.title,
    title: proposal.title,
    seriesStatus: "BOARD_REVIEW",
    decisionStatus: proposal.status === "TIE_BREAK" ? "TIE_BREAK_REQUIRED" : "PENDING",
    requestedPublicationType: proposal.requestedPublicationType ?? "MONTHLY",
    publicationType: proposal.requestedPublicationType ?? "MONTHLY",
    genres: proposal.genres ?? [],
    tags: proposal.genres ?? [],
    voteSummary: {
      APPROVE: tally.approve,
      REJECT: tally.reject,
      NEEDS_REVISION: 0,
      approve: tally.approve,
      reject: tally.reject,
      needsRevision: 0,
      pending: Math.max(BOARD_TOTAL - tally.total, 0),
      eligible: BOARD_TOTAL,
      quorum: BOARD_QUORUM,
      canFinalize,
    },
    eligibleBoardCount: BOARD_TOTAL,
    quorum: BOARD_QUORUM,
    voteCount: tally.total,
    canFinalize,
    updatedAt: proposal.updatedAt,
  };
}

function summarizeBoardQueue(items: BoardQueueItem[]) {
  return {
    total: items.length,
    pending: items.filter((item) => item.decisionStatus === "PENDING" && !item.canFinalize).length,
    needsFinalize: items.filter((item) => item.canFinalize).length,
    tieBreak: items.filter((item) => item.decisionStatus === "TIE_BREAK_REQUIRED").length,
  };
}

export function castBoardProposalVote(
  req: AuthedRequest,
  proposalId: string,
  payload: Record<string, unknown>,
) {
  return applyProposalAction(req, proposalId, "VOTE", payload);
}

export function finalizeBoardProposal(
  req: AuthedRequest,
  proposalId: string,
  payload: {
    decision: "APPROVED" | "REJECTED";
    note?: string;
    publicationType?: string;
    tantouEditorId?: string;
    editorId?: string;
  },
) {
  return applyProposalAction(req, proposalId, "FORCE_STATUS", {
    forceStatus: payload.decision,
    comment: payload.note,
    publicationType: payload.publicationType,
    tantouEditorId: payload.tantouEditorId ?? payload.editorId,
  });
}
