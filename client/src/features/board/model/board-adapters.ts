import type { VoteDecision } from "@/entities/proposal/model/proposal-types";
import type { RiskLevel } from "@/entities/board/model/board-types";

export interface BoardVote {
  memberId: string;
  memberName: string;
  decision: VoteDecision;
  comment?: string;
  createdAt: string;
  weight: number;
  isChair: boolean;
  isEditorInChief: boolean;
}

export interface BoardTally {
  approve: number;
  reject: number;
  abstain: number;
  total: number;
  status: "APPROVED" | "REJECTED" | "TIE_BREAK" | null;
  reason: string;
}

export interface BoardQueueItem {
  id: string;
  seriesId: string;
  seriesTitle: string;
  title: string;
  genres: string[];
  decisionStatus: "PENDING" | "TIE_BREAK_REQUIRED";
  seriesStatus: string;
  voteSummary: {
    approve: number;
    reject: number;
    abstain: number;
    pending: number;
    eligible: number;
    quorum: number;
    canFinalize: boolean;
  };
  canFinalize: boolean;
  voteCount: number;
  updatedAt: string;
  proposalStatus: "PENDING_BOARD" | "TIE_BREAK";
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
  votes: BoardVote[];
  tally: BoardTally;
  status: string;
}

function mapDecisionStatus(raw: string): "PENDING" | "TIE_BREAK_REQUIRED" {
  if (raw === "TIE_BREAK_REQUIRED") return "TIE_BREAK_REQUIRED";
  return "PENDING";
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
    } as AtRiskQueueItem;
  }

  const vs = (raw.voteSummary as Record<string, unknown>) ?? {};
  return {
    id: String(raw.id ?? raw.seriesId),
    seriesId: String(raw.seriesId),
    seriesTitle: String(raw.seriesTitle ?? raw.title ?? ""),
    title: String(raw.seriesTitle ?? raw.title ?? ""),
    genres: Array.isArray(raw.genres) ? raw.genres.map(String) : [],
    decisionStatus: mapDecisionStatus(String(raw.decisionStatus ?? "PENDING")),
    seriesStatus: String(raw.seriesStatus ?? "BOARD_REVIEW"),
    voteSummary: {
      approve: Number(vs.approve ?? 0),
      reject: Number(vs.reject ?? 0),
      abstain: Number(vs.abstain ?? 0),
      pending: Math.max(0, 5 - Number(vs.total ?? raw.voteCount ?? 0)),
      eligible: Number(vs.eligible ?? 5),
      quorum: Number(vs.quorum ?? 3),
      canFinalize: Boolean(vs.canFinalize ?? raw.canFinalize ?? false),
    },
    canFinalize: Boolean(raw.canFinalize ?? vs.canFinalize ?? false),
    voteCount: Number(raw.voteCount ?? vs.total ?? 0),
    updatedAt: String(raw.updatedAt ?? ""),
    proposalStatus: raw.decisionStatus === "TIE_BREAK_REQUIRED" ? "TIE_BREAK" : "PENDING_BOARD",
  } as BoardQueueItem;
}

export function mapBoardVotes(raw: Record<string, unknown>): BoardVotesResult {
  const votes =
    (raw.votes as Record<string, unknown>[] | undefined)?.map((v) => ({
      memberId: String(v.memberId ?? v.voterId ?? ""),
      memberName: String(v.memberName ?? v.voterName ?? ""),
      decision: (v.decision as VoteDecision) ?? "ABSTAIN",
      comment: v.comment ? String(v.comment) : undefined,
      createdAt: String(v.createdAt ?? v.votedAt ?? ""),
      weight: Number(v.weight ?? 1),
      isChair: Boolean(v.isChair ?? false),
      isEditorInChief: Boolean(v.isEditorInChief ?? false),
    })) ?? [];

  const tally = (raw.tally as Record<string, unknown>) ?? {};
  return {
    seriesId: String(raw.seriesId ?? ""),
    votes,
    tally: {
      approve: Number(tally.approve ?? 0),
      reject: Number(tally.reject ?? 0),
      abstain: Number(tally.abstain ?? 0),
      total: Number(tally.total ?? 0),
      status: (tally.status as BoardTally["status"]) ?? null,
      reason: String(tally.reason ?? ""),
    },
    status: String(raw.status ?? ""),
  };
}

export function getProposalStatusFromQueueItem(
  item: BoardQueueItem,
): "PENDING_BOARD" | "TIE_BREAK" | "APPROVED" | "REJECTED" {
  if (item.decisionStatus === "TIE_BREAK_REQUIRED") return "TIE_BREAK";
  if (item.voteSummary.canFinalize) {
    if (item.voteSummary.approve > item.voteSummary.reject) return "APPROVED";
    if (item.voteSummary.reject > item.voteSummary.approve) return "REJECTED";
  }
  return "PENDING_BOARD";
}

export function getTabFromQueueItem(item: BoardQueueItem): string {
  if (item.decisionStatus === "TIE_BREAK_REQUIRED") return "Tie-break";
  if (item.voteSummary.canFinalize) {
    if (item.voteSummary.approve > item.voteSummary.reject) return "Approved";
    if (item.voteSummary.reject > item.voteSummary.approve) return "Rejected";
  }
  return "Pending Vote";
}
