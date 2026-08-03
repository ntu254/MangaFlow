export type VotingSessionMode = "AD_HOC" | "SCHEDULED";

export type VotingSessionStatus =
  | "OPEN"
  | "TIED"
  | "FINALIZED"
  | "NO_QUORUM"
  | "CANCELLED";

export type TiePolicy = "CHAIR_DECIDES" | "REJECT" | "RETURN_TO_BOARD";

export type TieResolution =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RETURNED_TO_BOARD";

export type SessionOutcomeDecision =
  | "APPROVED"
  | "REJECTED"
  | "TIED"
  | "NO_QUORUM"
  | "PENDING";

export type SessionProposalOutcome = {
  proposalId: string;
  decision: SessionOutcomeDecision;
  approve: number;
  reject: number;
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
  votingRound?: number;
  tiePolicy?: TiePolicy;
  tieResolution?: TieResolution;
  tieResolutionNote?: string;
  tieResolvedById?: string;
  tieResolvedAt?: string;
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
  OPEN: "Open",
  TIED: "Tied (policy applies)",
  FINALIZED: "Finalized",
  NO_QUORUM: "No Quorum",
  CANCELLED: "Cancelled",
};

export const SESSION_STATUS_HELP: Record<
  VotingSessionStatus,
  { description: string; nextStep: string }
> = {
  OPEN: {
    description: "This is the active voting round. Board members can cast one vote each.",
    nextStep: "Board members vote; the Chair closes the session when the round is complete.",
  },
  TIED: {
    description: "This round ended in a tie and is preserved as immutable history.",
    nextStep: "Use the configured re-vote or Chair resolution policy.",
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
};

export const OUTCOME_LABEL: Record<SessionOutcomeDecision, string> = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  TIED: "Tied (policy applies)",
  NO_QUORUM: "No Quorum",
  PENDING: "Pending",
};
