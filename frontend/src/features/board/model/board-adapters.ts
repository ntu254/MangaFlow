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
  coverUrl?: string | null;
  coverFileKey?: string | null;
  genres: string[];
  decisionStatus: "PENDING";
  votingSessionId: string | null;
  proposalVersionId: string | null;
  expectedVersion: number | null;
  // Sprint 1.2 — `riskStatus` is the canonical split for the at-risk
  // dimension. For proposals on the queue this is always "NORMAL"; the
  // interface stays union-compatible with `AtRiskQueueItem` so the same
  // hook can return either shape without a runtime crash.
  seriesStatus: string;
  riskStatus?: "NORMAL" | "AT_RISK";
  riskEvaluatedAt?: string | null;
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
  proposalStatus: "PENDING_BOARD" | "BOARD_REVIEW" | "APPROVED" | "REJECTED";
}

export interface AtRiskQueueItem {
  id: string;
  seriesId: string;
  seriesTitle: string;
  title: string;
  // Sprint 1.2 — riskStatus is the canonical risk dimension; seriesStatus
  // carries the real lifecycle status (ONGOING / PAUSED / ARCHIVED / …).
  // `riskEvaluatedAt` lets the UI render "Evaluated …" without re-fetching.
  seriesStatus: string;
  /** Sprint 2 — API-001 canonical alias for the real lifecycle status. */
  lifecycleStatus?: string;
  riskStatus: "AT_RISK";
  riskEvaluatedAt?: string | null;
  riskSourceRankingPeriod?: string | null;
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
  // Sprint 1.2: the canonical signal for "this queue item is a risk review"
  // is `riskStatus === "AT_RISK"`. The legacy `seriesStatus === "AT_RISK"`
  // sentinel is no longer returned from the backend; the new split is
  //   seriesStatus: real lifecycle (ONGOING / PAUSED / …)
  //   riskStatus:   risk dimension (NORMAL / AT_RISK)
  if (raw.riskStatus === "AT_RISK") {
    return {
      id: String(raw.id ?? raw.seriesId),
      seriesId: String(raw.seriesId),
      seriesTitle: String(raw.seriesTitle ?? raw.title ?? ""),
      title: String(raw.seriesTitle ?? raw.title ?? ""),
      seriesStatus: String(raw.seriesStatus ?? "ONGOING"),
      lifecycleStatus: String(raw.lifecycleStatus ?? raw.seriesStatus ?? "ONGOING"),
      riskStatus: "AT_RISK",
      riskEvaluatedAt: raw.riskEvaluatedAt ? String(raw.riskEvaluatedAt) : null,
      riskSourceRankingPeriod: raw.riskSourceRankingPeriod
        ? String(raw.riskSourceRankingPeriod)
        : null,
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
    coverUrl: raw.coverUrl ? String(raw.coverUrl) : null,
    coverFileKey: raw.coverFileKey ? String(raw.coverFileKey) : null,
    genres: Array.isArray(raw.genres) ? raw.genres.map(String) : [],
    decisionStatus: "PENDING",
    seriesStatus: String(raw.seriesStatus ?? "BOARD_REVIEW"),
    lifecycleStatus: String(raw.lifecycleStatus ?? raw.seriesStatus ?? "BOARD_REVIEW"),
    riskStatus: raw.riskStatus === "AT_RISK" ? "AT_RISK" : "NORMAL",
    riskEvaluatedAt: raw.riskEvaluatedAt ? String(raw.riskEvaluatedAt) : null,
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
    proposalStatus: (raw.seriesStatus ?? "PENDING_BOARD") as BoardQueueItem["proposalStatus"],
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
  return item.proposalStatus;
}

export function getTabFromQueueItem(_item: BoardQueueItem): string {
  return "Needs Session";
}
