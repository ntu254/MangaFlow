import type { VoteDecision } from "@/entities/proposal/model/proposal-types";

export interface BoardVote {
  voterId: string;
  voterName: string;
  decision: VoteDecision;
  comment?: string;
  createdAt: string;
  weight: number;
}

export interface BoardTally {
  approve: number;
  reject: number;
  total: number;
  status: "APPROVED" | "REJECTED" | null;
  reason: string;
}

export interface BoardQueueItem {
  id: string;
  seriesId: string;
  seriesTitle: string;
  title: string;
  genres: string[];
  decisionStatus: "PENDING";
  votingSessionId: string | null;
  proposalVersionId: string | null;
  expectedVersion: number | null;
  seriesStatus: string;
  voteSummary: {
    approve: number;
    reject: number;
    pending: number;
    eligible: number;
    quorum: number;
    canFinalize: boolean;
  };
  canFinalize: boolean;
  voteCount: number;
  updatedAt: string;
  proposalStatus: "PENDING_BOARD" | "BOARD_REVIEW";
}

export interface AtRiskQueueItem {
  id: string;
  seriesId: string;
  seriesTitle: string;
  title: string;
  seriesStatus: "AT_RISK";
  decisionStatus: "PENDING";
  updatedAt: string;
}

export interface BoardVotesResult {
  seriesId: string;
  votingSessionId: string | null;
  proposalVersionId: string | null;
  expectedVersion: number | null;
  votes: BoardVote[];
  tally: BoardTally;
  status: string;
  quorum: number;
  eligibleVoterIds: string[];
}

export function mapBoardQueueItem(raw: Record<string, unknown>): BoardQueueItem | AtRiskQueueItem {
  if (raw.seriesStatus === "AT_RISK") {
    return {
      id: String(raw.id ?? raw.seriesId),
      seriesId: String(raw.seriesId),
      seriesTitle: String(raw.seriesTitle ?? raw.title ?? ""),
      title: String(raw.seriesTitle ?? raw.title ?? ""),
      seriesStatus: "AT_RISK",
      decisionStatus: "PENDING",
      updatedAt: String(raw.updatedAt ?? ""),
    };
  }

  const summary = (raw.voteSummary as Record<string, unknown>) ?? {};
  const eligible = Number(summary.eligible ?? 0);
  const total = Number(summary.total ?? raw.voteCount ?? 0);
  return {
    id: String(raw.id ?? raw.seriesId),
    seriesId: String(raw.seriesId),
    seriesTitle: String(raw.seriesTitle ?? raw.title ?? ""),
    title: String(raw.seriesTitle ?? raw.title ?? ""),
    genres: Array.isArray(raw.genres) ? raw.genres.map(String) : [],
    decisionStatus: "PENDING",
    seriesStatus: String(raw.seriesStatus ?? "BOARD_REVIEW"),
    voteSummary: {
      approve: Number(summary.approve ?? 0),
      reject: Number(summary.reject ?? 0),
      pending: Math.max(0, eligible - total),
      eligible,
      quorum: Number(summary.quorum ?? 3),
      canFinalize: Boolean(summary.canFinalize ?? raw.canFinalize ?? false),
    },
    canFinalize: Boolean(raw.canFinalize ?? summary.canFinalize ?? false),
    voteCount: Number(raw.voteCount ?? total),
    updatedAt: String(raw.updatedAt ?? ""),
    votingSessionId: raw.votingSessionId ? String(raw.votingSessionId) : null,
    proposalVersionId: raw.proposalVersionId ? String(raw.proposalVersionId) : null,
    expectedVersion: raw.expectedVersion == null ? null : Number(raw.expectedVersion),
    proposalStatus: raw.seriesStatus === "BOARD_REVIEW" ? "BOARD_REVIEW" : "PENDING_BOARD",
  };
}

export function mapBoardVotes(raw: Record<string, unknown>): BoardVotesResult {
  const votes = ((raw.votes as Record<string, unknown>[] | undefined) ?? [])
    .filter((vote) => vote.decision === "APPROVE" || vote.decision === "REJECT")
    .map((vote) => ({
      voterId: String(vote.voterId ?? ""),
      voterName: String(vote.voterName ?? ""),
      decision: vote.decision as VoteDecision,
      comment: vote.comment ? String(vote.comment) : undefined,
      createdAt: String(vote.createdAt ?? ""),
      weight: Number(vote.weight ?? 1),
    }));

  const tally = (raw.tally as Record<string, unknown>) ?? {};
  return {
    seriesId: String(raw.seriesId ?? ""),
    votingSessionId: raw.votingSessionId ? String(raw.votingSessionId) : null,
    proposalVersionId: raw.proposalVersionId ? String(raw.proposalVersionId) : null,
    expectedVersion: raw.expectedVersion == null ? null : Number(raw.expectedVersion),
    votes,
    tally: {
      approve: Number(tally.approve ?? 0),
      reject: Number(tally.reject ?? 0),
      total: Number(tally.total ?? 0),
      status: (tally.status as BoardTally["status"]) ?? null,
      reason: String(tally.reason ?? ""),
    },
    status: String(raw.status ?? ""),
    quorum: Number(raw.quorum ?? 3),
    eligibleVoterIds: Array.isArray(raw.eligibleVoterIds)
      ? raw.eligibleVoterIds.map(String)
      : [],
  };
}

export function getProposalStatusFromQueueItem(
  item: BoardQueueItem,
): "PENDING_BOARD" | "BOARD_REVIEW" | "APPROVED" | "REJECTED" {
  return item.votingSessionId ? "BOARD_REVIEW" : "PENDING_BOARD";
}

export function getTabFromQueueItem(_item: BoardQueueItem): string {
  return "Pending Vote";
}
