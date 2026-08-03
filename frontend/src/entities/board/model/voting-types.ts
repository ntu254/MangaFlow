import type { VoteDecision } from "@/entities/proposal/model/proposal-types";

export type VotingSessionMode = "AD_HOC" | "SCHEDULED";
export type VotingSessionStatus =
  | "DRAFT"
  | "OPEN"
  | "CLOSED"
  | "TIED"
  | "TIE_BREAK_REQUIRED"
  | "FINALIZED"
  | "NO_QUORUM"
  | "CANCELLED"
  | "CANCELED";

export type SessionOutcomeDecision =
  | "APPROVED"
  | "REJECTED"
  | "TIED"
  | "TIE_BREAK_REQUIRED"
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
  version?: number;
  proposalVersionId?: string;
  scheduledFor?: string;
  closesAt?: string;
  proposalIds: string[];
  proposalId?: string;
  reVoteOfSessionId?: string;
  targetType?: "PROPOSAL";
  result?: "APPROVED" | "REJECTED" | null;
  createdById: string;
  createdByName: string;
  openedAt: string;
  closedAt?: string;
  outcomes: SessionProposalOutcome[];
  notes: SessionNote[];
};

export const SESSION_MODE_LABEL: Record<VotingSessionMode, string> = {
  AD_HOC: "Ad-hoc",
  SCHEDULED: "Scheduled",
};

export const SESSION_STATUS_LABEL: Record<VotingSessionStatus, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  CLOSED: "Closed",
  TIED: "Tied (re-vote opened)",
  TIE_BREAK_REQUIRED: "Tie-break Required",
  FINALIZED: "Finalized",
  NO_QUORUM: "No Quorum",
  CANCELLED: "Cancelled",
  CANCELED: "Cancelled",
};

export const SESSION_STATUS_HELP: Record<
  VotingSessionStatus,
  { description: string; nextStep: string }
> = {
  DRAFT: {
    description: "The session has been prepared but is not accepting votes.",
    nextStep: "A Chair must open the session before voting can start.",
  },
  OPEN: {
    description: "This is the active voting round. Board members can cast one vote each.",
    nextStep: "Board members vote; the Chair closes the session when the round is complete.",
  },
  CLOSED: {
    description: "The round is closed and no longer accepts votes.",
    nextStep: "Review the tally and outcome recorded for this round.",
  },
  TIED: {
    description: "This round ended in a tie and is preserved as immutable history.",
    nextStep: "Continue in the fresh OPEN Board re-vote created by the system.",
  },
  TIE_BREAK_REQUIRED: {
    description: "Legacy tie-break history. It is kept for audit and is read-only.",
    nextStep: "No EIC action is required; current ties use a fresh Board re-vote.",
  },
  FINALIZED: {
    description: "The Board decision is complete and this round is immutable.",
    nextStep: "Open the proposal to review the final decision and audit trail.",
  },
  NO_QUORUM: {
    description: "The round closed without enough votes to make a decision.",
    nextStep: "A Chair can create a new voting session if the proposal needs another round.",
  },
  CANCELLED: {
    description: "The Chair cancelled this round before a final decision.",
    nextStep: "Create a new session if the proposal should return to Board review.",
  },
  CANCELED: {
    description: "The Chair cancelled this round before a final decision.",
    nextStep: "Create a new session if the proposal should return to Board review.",
  },
};

export const OUTCOME_LABEL: Record<SessionOutcomeDecision, string> = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  TIED: "Tied (re-vote opened)",
  TIE_BREAK_REQUIRED: "Tie-break required",
  TIE_BROKEN_APPROVED: "Tie-break → Approved",
  TIE_BROKEN_REJECTED: "Tie-break → Rejected",
  NO_QUORUM: "No Quorum",
  PENDING: "Pending",
};

export const EIC_TIEBREAK_WEIGHT = 2;
