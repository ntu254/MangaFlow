import type { Request } from "express";

export type Role = "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
export type WebRole = "admin" | "mangaka" | "assistant" | "editor" | "board";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isChair?: boolean;
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
  | "ARCHIVED";

export type VotingSessionStatus =
  | "OPEN"
  | "NO_QUORUM"
  | "TIED"
  | "FINALIZED"
  | "CANCELLED";

export type VoteDecision = "APPROVE" | "REJECT";

export type TiePolicy = "CHAIR_DECIDES" | "REJECT" | "RETURN_TO_BOARD";

export type TieResolution =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RETURNED_TO_BOARD";

export type ProposalAction =
  | "SUBMIT"
  | "WITHDRAW"
  | "EDIT"
  | "CLAIM"
  | "RELEASE_CLAIM"
  | "UPDATE_EDITORIAL_CHECKLIST"
  | "REQUEST_CHANGES"
  | "RESUBMIT"
  | "FORWARD"
  | "REJECT"
  | "RECALL"
  | "VOTE"
  | "ARCHIVE";

export const PROPOSAL_ACTIONS: readonly ProposalAction[] = [
  "SUBMIT",
  "WITHDRAW",
  "EDIT",
  "CLAIM",
  "RELEASE_CLAIM",
  "UPDATE_EDITORIAL_CHECKLIST",
  "REQUEST_CHANGES",
  "RESUBMIT",
  "FORWARD",
  "REJECT",
  "RECALL",
  "VOTE",
  "ARCHIVE",
];

// ---------------------------------------------------------------------------
// Chapter
// ---------------------------------------------------------------------------

/**
 * Canonical chapter lifecycle:
 *   PLANNED → IN_PRODUCTION → TANTOU_REVIEW ⇄ REVISION_REQUIRED
 *           → READY_FOR_PUBLICATION → PUBLISHED
 *
 * Scheduling is NOT a chapter status: a chapter stays READY_FOR_PUBLICATION
 * while its Publication is SCHEDULED, and only becomes PUBLISHED when it
 * actually publishes. Existing rows are converted before this type is used.
 */
export type ChapterStatus =
  | "PLANNED"
  | "IN_PRODUCTION"
  | "TANTOU_REVIEW"
  | "REVISION_REQUIRED"
  | "READY_FOR_PUBLICATION"
  | "PUBLISHED";

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
  | "REASSIGN";

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
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const PAGE_STATUSES = [
  "PENDING_UPLOAD",
  "UPLOADED",
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
  | "CANCELLED";

export type TaskAssignmentStatus =
  "UNASSIGNED" | "PENDING" | "ACCEPTED" | "REJECTED";

export type TaskAction =
  | "ACCEPT"
  | "REJECT"
  | "START"
  | "CANCEL"
  | "REOPEN"
  | "REASSIGN";

export const TASK_ACTIONS: readonly TaskAction[] = [
  "ACCEPT",
  "REJECT",
  "START",
  "CANCEL",
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
  | "REJECTED";

// ---------------------------------------------------------------------------
// Earning
// ---------------------------------------------------------------------------

export type EarningItemStatus =
  "PENDING" | "APPROVED" | "VOIDED" | "EARNED" | "ADJUSTED" | "REVERSED";

export type EarningStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "VOIDED"
  | "EARNED"
  | "ADJUSTED"
  | "REVERSED";

export type PublicationStatus =
  "DRAFT" | "SCHEDULED" | "PUBLISHED" | "CANCELLED";

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

export type RankingSource = "MANUAL" | "CSV_IMPORT" | "API";

export type RankingImportStatus =
  "PENDING" | "VALIDATED" | "IMPORTED" | "FAILED";

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

export type CommentTargetType =
  "CHAPTER" | "PAGE" | "REGION" | "TASK" | "SUBMISSION";

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------

export type SeriesVisibility = "PRIVATE" | "PUBLIC" | "UNLISTED";

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
