import type { VoteDecision } from "@/entities/proposal/model/proposal-types";

export type VotingSessionMode = "AD_HOC" | "SCHEDULED";
export type VotingSessionStatus = "OPEN" | "CLOSED" | "CANCELED";

export type SessionOutcomeDecision =
  | "APPROVED"
  | "REJECTED"
  | "TIE_BROKEN_APPROVED"
  | "TIE_BROKEN_REJECTED"
  | "NO_QUORUM"
  | "PENDING";

export type SessionProposalOutcome = {
  proposalId: string;
  decision: SessionOutcomeDecision;
  approve: number;
  reject: number;
  abstain: number;
  tieBreakBy?: string;
  tieBreakByName?: string;
  tieBreakDecision?: VoteDecision;
  decidedAt?: string;
  reason: string;
};

export type SessionNote = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
};

export type VotingSession = {
  id: string;
  title: string;
  mode: VotingSessionMode;
  status: VotingSessionStatus;
  scheduledFor?: string;
  closesAt?: string;
  proposalIds: string[];
  createdById: string;
  createdByName: string;
  openedAt: string;
  closedAt?: string;
  outcomes: SessionProposalOutcome[];
  notes: SessionNote[];
};

export const SESSION_MODE_LABEL: Record<VotingSessionMode, string> = {
  AD_HOC: "Ad-hoc",
  SCHEDULED: "Lịch họp",
};

export const SESSION_STATUS_LABEL: Record<VotingSessionStatus, string> = {
  OPEN: "Đang mở",
  CLOSED: "Đã đóng",
  CANCELED: "Đã hủy",
};

export const OUTCOME_LABEL: Record<SessionOutcomeDecision, string> = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  TIE_BROKEN_APPROVED: "Tie-break → Approved",
  TIE_BROKEN_REJECTED: "Tie-break → Rejected",
  NO_QUORUM: "Chưa đủ phiếu",
  PENDING: "Đang chờ",
};

export const EIC_TIEBREAK_WEIGHT = 2;
