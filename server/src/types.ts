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
  | "SUBMITTED"
  | "PENDING_EDITOR"
  | "EDITOR_REVIEWING"
  | "CHANGES_REQUESTED"
  | "RESUBMITTED"
  | "PENDING_BOARD"
  | "BOARD_VOTING"
  | "TIE_BREAK"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN"
  | "ARCHIVED";

export type VoteDecision = "APPROVE" | "REJECT" | "ABSTAIN";

export type ProposalAction =
  | "SUBMIT"
  | "WITHDRAW"
  | "EDIT"
  | "CLAIM"
  | "RELEASE_CLAIM"
  | "REASSIGN_CLAIM"
  | "REQUEST_CHANGES"
  | "RESUBMIT"
  | "FORWARD"
  | "REJECT"
  | "RECALL"
  | "VOTE"
  | "FORCE_STATUS"
  | "ARCHIVE";

export const PROPOSAL_ACTIONS: readonly ProposalAction[] = [
  "SUBMIT", "WITHDRAW", "EDIT", "CLAIM", "RELEASE_CLAIM", "REASSIGN_CLAIM",
  "REQUEST_CHANGES", "RESUBMIT", "FORWARD", "REJECT", "RECALL", "VOTE",
  "FORCE_STATUS", "ARCHIVE",
];

// ---------------------------------------------------------------------------
// Chapter
// ---------------------------------------------------------------------------

export type ChapterStatus =
  | "IN_PRODUCTION"
  | "PLANNED"
  | "DRAFTING"
  | "ASSISTANT_WORKING"
  | "MANGAKA_REVIEW"
  | "EDITOR_REVIEW"
  | "REVISION"
  | "EDITOR_APPROVED"
  | "READY_FOR_PUBLICATION"
  /**
   * Legacy only. New scheduling writes must use Publication.status.
   * @deprecated
   */
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED";

/**
 * Legacy alias kept for backward-compat.
 * @deprecated Use individual status strings instead.
 */
export type LegacyChapterStatus = ChapterStatus | "IN_REVIEW" | "APPROVED";

export type ChapterAction =
  | "START_DRAFT"
  | "START_ASSISTANT_WORK"
  | "SUBMIT_REVIEW"
  | "REQUEST_REVISION"
  | "REJECT"
  | "RESUBMIT"
  | "EDITOR_APPROVE"
  | "MARK_READY"
  | "SCHEDULE"
  | "POSTPONE"
  | "PUBLISH"
  | "REASSIGN"
  | "ARCHIVE";

export const CHAPTER_ACTIONS: readonly ChapterAction[] = [
  "START_DRAFT", "START_ASSISTANT_WORK", "SUBMIT_REVIEW", "REQUEST_REVISION",
  "REJECT", "RESUBMIT", "EDITOR_APPROVE", "MARK_READY", "SCHEDULE", "POSTPONE",
  "PUBLISH", "REASSIGN", "ARCHIVE",
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
  "READY_FOR_EDITOR_REVIEW",
  "EDITOR_APPROVED",
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
  | "MANGAKA_REVIEWING"
  | "MANGAKA_REVISION_REQUESTED"
  | "MANGAKA_APPROVED"
  | "EDITOR_REVIEWING"
  | "EDITOR_REVISION_REQUESTED"
  | "EDITOR_APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type TaskAction =
  | "START"
  | "SUBMIT"
  | "REQUEST_REVISION"
  | "APPROVE"
  | "MANGAKA_APPROVE"
  | "EDITOR_APPROVE"
  | "REJECT"
  | "CANCEL"
  | "BLOCK"
  | "MARK_BLOCKED"
  | "UNBLOCK"
  | "REOPEN"
  | "REASSIGN";

export const TASK_ACTIONS: readonly TaskAction[] = [
  "START", "SUBMIT", "REQUEST_REVISION", "APPROVE", "MANGAKA_APPROVE",
  "EDITOR_APPROVE", "REJECT", "CANCEL", "BLOCK", "MARK_BLOCKED",
  "UNBLOCK", "REOPEN", "REASSIGN",
];

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------

export type SubmissionStatus =
  | "DRAFT"
  | "PENDING"
  | "MANGAKA_APPROVED"
  | "MANGAKA_REVISION_REQUESTED"
  | "EDITOR_APPROVED"
  | "EDITOR_REVISION_REQUESTED"
  | "REJECTED"
  | "SUPERSEDED";

export type SubmissionReviewStage = "MANGAKA_REVIEW" | "EDITOR_REVIEW" | "FINAL";

// ---------------------------------------------------------------------------
// Earning
// ---------------------------------------------------------------------------

export type EarningItemStatus = "PENDING" | "APPROVED" | "VOIDED";

export type EarningStatus = "PENDING" | "CONFIRMED" | "PAID" | "VOIDED";

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

export type RegionLockStatus = "UNLOCKED" | "LOCKED" | "RELEASED";

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
