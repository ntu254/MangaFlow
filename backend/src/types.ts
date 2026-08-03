import type { Request } from "express";

export type Role = "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
export type WebRole = "admin" | "mangaka" | "assistant" | "editor" | "board";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isChair?: boolean;
  isEditorInChief?: boolean;
};

export type RequestActor = AuthUser & {
  sessionId?: string;
};

export type AuthedRequest = Request & {
  requestId?: string;
  actor?: RequestActor;
};

// ---------------------------------------------------------------------------
// Proposal
// ---------------------------------------------------------------------------

export type ProposalStatus =
  | "DRAFT"
  | "PENDING_EDITOR"
  | "EDITOR_REVIEWING"
  | "CHANGES_REQUESTED"
  | "PENDING_BOARD"
  | "BOARD_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN"
  /**
   * Legacy intake alias. New submissions write PENDING_EDITOR.
   * @deprecated
   */
  | "SUBMITTED"
  /**
   * Legacy revision alias. New resubmissions write PENDING_EDITOR or EDITOR_REVIEWING.
   * @deprecated
   */
  | "RESUBMITTED"
  /**
   * Legacy Board-ready alias. New editor forwards write PENDING_BOARD.
   * @deprecated
   */
  | "READY_FOR_BOARD"
  /**
   * Legacy denormalized vote state. VotingSession is the source of truth.
   * @deprecated
   */
  | "BOARD_VOTING"
  /**
   * Legacy denormalized tie-break state. VotingSessionStatus.TIE_BREAK_REQUIRED is canonical.
   * @deprecated
   */
  | "TIE_BREAK"
  | "ARCHIVED";

export type VotingSessionStatus =
  | "OPEN"
  | "NO_QUORUM"
  | "TIED"
  | "TIE_BREAK_REQUIRED"
  | "FINALIZED"
  | "CANCELLED";

export type VoteDecision = "APPROVE" | "REJECT" | "ABSTAIN";

export type ProposalAction =
  | "SUBMIT"
  | "WITHDRAW"
  | "EDIT"
  | "CLAIM"
  | "RELEASE_CLAIM"
  | "REASSIGN_CLAIM"
  | "UPDATE_EDITORIAL_CHECKLIST"
  | "REQUEST_CHANGES"
  | "RESUBMIT"
  | "FORWARD"
  | "REJECT"
  | "RECALL"
  | "VOTE"
  | "FORCE_STATUS"
  | "ARCHIVE";

export const PROPOSAL_ACTIONS: readonly ProposalAction[] = [
  "SUBMIT",
  "WITHDRAW",
  "EDIT",
  "CLAIM",
  "RELEASE_CLAIM",
  "REASSIGN_CLAIM",
  "UPDATE_EDITORIAL_CHECKLIST",
  "REQUEST_CHANGES",
  "RESUBMIT",
  "FORWARD",
  "REJECT",
  "RECALL",
  "VOTE",
  "FORCE_STATUS",
  "ARCHIVE",
];

// ---------------------------------------------------------------------------
// Chapter
// ---------------------------------------------------------------------------

/**
 * Canonical chapter lifecycle:
 *   PLANNED → IN_PRODUCTION → TANTOU_REVIEW ⇄ REVISION_REQUIRED
 *           → READY_FOR_PUBLICATION → PUBLISHED (+ ARCHIVED)
 *
 * Scheduling is NOT a chapter status: a chapter stays READY_FOR_PUBLICATION
 * while its Publication is SCHEDULED, and only becomes PUBLISHED when it
 * actually publishes. Legacy statuses (DRAFTING, ASSISTANT_WORKING,
 * MANGAKA_REVIEW, EDITOR_REVIEW, REVISION, EDITOR_APPROVED, IN_REVIEW,
 * APPROVED, SCHEDULED) were retired; existing rows are converted by
 * scripts/migrate-chapter-status-canonical.ts.
 */
export type ChapterStatus =
  | "PLANNED"
  | "IN_PRODUCTION"
  | "TANTOU_REVIEW"
  | "REVISION_REQUIRED"
  | "READY_FOR_PUBLICATION"
  | "PUBLISHED"
  | "ARCHIVED";

export type ChapterAction =
  | "START_DRAFT"
  | "START_ASSISTANT_WORK"
  | "SUBMIT_REVIEW"
  | "REQUEST_REVISION"
  | "REJECT"
  | "RESUBMIT"
  | "EDITOR_APPROVE"
  | "SCHEDULE"
  | "POSTPONE"
  | "PUBLISH"
  | "PUBLISH_EARLY"
  | "REASSIGN"
  | "ARCHIVE";

export const CHAPTER_ACTIONS: readonly ChapterAction[] = [
  "START_DRAFT",
  "START_ASSISTANT_WORK",
  "SUBMIT_REVIEW",
  "REQUEST_REVISION",
  "REJECT",
  "RESUBMIT",
  "EDITOR_APPROVE",
  "SCHEDULE",
  "POSTPONE",
  "PUBLISH",
  "PUBLISH_EARLY",
  "REASSIGN",
  "ARCHIVE",
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const PAGE_STATUSES = [
  "PENDING_UPLOAD",
  "UPLOADED",
  "REGIONING",
  "IN_PRODUCTION",
  "MANGAKA_REVIEW",
  "REVISION_REQUIRED",
  "TANTOU_REVIEW",
  "FINALIZED",
] as const;

export type PageStatus = (typeof PAGE_STATUSES)[number];

// ---------------------------------------------------------------------------
// StudioTask
// ---------------------------------------------------------------------------

export type StudioTaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "MANGAKA_APPROVED"
  | "REJECTED"
  | "CANCELLED"
  // Legacy statuses kept for compatibility reads during migration.
  | "MANGAKA_REVIEWING"
  | "MANGAKA_REVISION_REQUESTED"
  | "EDITOR_REVIEWING"
  | "EDITOR_REVISION_REQUESTED"
  | "EDITOR_APPROVED";

export type TaskAction =
  | "START"
  | "SUBMIT"
  | "CANCEL"
  | "BLOCK"
  | "MARK_BLOCKED"
  | "UNBLOCK"
  | "REOPEN"
  | "REASSIGN";

export const TASK_ACTIONS: readonly TaskAction[] = [
  "START",
  "SUBMIT",
  "CANCEL",
  "BLOCK",
  "MARK_BLOCKED",
  "UNBLOCK",
  "REOPEN",
  "REASSIGN",
];

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------

export type SubmissionStatus =
  | "PENDING"
  | "MANGAKA_APPROVED"
  | "REVISION_REQUESTED"
  | "SUPERSEDED"
  | "REJECTED"
  // Legacy statuses kept for compatibility reads during migration.
  | "MANGAKA_REVISION_REQUESTED"
  | "EDITOR_APPROVED"
  | "EDITOR_REVISION_REQUESTED";

export type SubmissionReviewStage = "MANGAKA_REVIEW" | "EDITOR_REVIEW" | "FINAL";

// ---------------------------------------------------------------------------
// Earning
// ---------------------------------------------------------------------------

export type EarningItemStatus =
  | "PENDING"
  | "APPROVED"
  | "VOIDED"
  | "EARNED"
  | "ADJUSTED"
  | "REVERSED";

export type EarningStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "VOIDED"
  | "EARNED"
  | "ADJUSTED"
  | "REVERSED";

export type PublicationStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "CANCELLED";

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

export type RankingSource = "MANUAL" | "CSV_IMPORT" | "API";

export type RankingImportStatus = "PENDING" | "VALIDATED" | "IMPORTED" | "FAILED";

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

export type NotificationAudienceType = "USER" | "ROLE" | "ALL";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH";

// ---------------------------------------------------------------------------
// Region / Studio lock
// ---------------------------------------------------------------------------

export type RegionLockStatus = "UNLOCKED" | "LOCKED";

// ---------------------------------------------------------------------------
// Comment
// ---------------------------------------------------------------------------

export type CommentTargetType = "CHAPTER" | "PAGE" | "REGION" | "TASK" | "SUBMISSION";

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------

export type SeriesVisibility = "PRIVATE" | "PUBLIC" | "UNLISTED" | "ARCHIVED";

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export type Envelope<T> = {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    pageSize: number;
    limit?: number;
    total: number;
    totalPages?: number;
  };
};

export type ErrorEnvelope = {
  success: false;
  data: null;
  message: string;
  code?: string;
  requestId?: string;
};
