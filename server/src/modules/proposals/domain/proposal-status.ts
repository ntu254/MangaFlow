import type { ProposalStatus } from "../../../types.js";

export const PROPOSAL_STATUSES = new Set<ProposalStatus>([
  "DRAFT",
  "SUBMITTED",
  "PENDING_EDITOR",
  "EDITOR_REVIEWING",
  "CHANGES_REQUESTED",
  "RESUBMITTED",
  "PENDING_BOARD",
  "BOARD_VOTING",
  "TIE_BREAK",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
]);
