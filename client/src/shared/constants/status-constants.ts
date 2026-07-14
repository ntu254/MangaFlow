/**
 * Shared Status Constants — Schema V2
 *
 * Single source of truth for all status/enum values used across frontend.
 * Import from here instead of hardcoding strings in components.
 */

// ---------------------------------------------------------------------------
// Chapter
// ---------------------------------------------------------------------------

export const CHAPTER_STATUSES = [
  "PLANNED",
  "DRAFTING",
  "ASSISTANT_WORKING",
  "MANGAKA_REVIEW",
  "EDITOR_REVIEW",
  "REVISION",
  "EDITOR_APPROVED",
  "READY_FOR_PUBLICATION",
  "SCHEDULED",
  "PUBLISHED",
] as const;

export type ChapterStatusV2 = (typeof CHAPTER_STATUSES)[number];

export const CHAPTER_STATUS_LABEL: Record<ChapterStatusV2, string> = {
  PLANNED: "Planned",
  DRAFTING: "Drafting",
  ASSISTANT_WORKING: "Assistant Working",
  MANGAKA_REVIEW: "Mangaka Review",
  EDITOR_REVIEW: "Editor Review",
  REVISION: "Revision",
  EDITOR_APPROVED: "Editor Approved",
  READY_FOR_PUBLICATION: "Ready for Publication",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
};

/** Ordered flow for progress display */
export const CHAPTER_STATUS_FLOW = [
  "PLANNED",
  "DRAFTING",
  "ASSISTANT_WORKING",
  "MANGAKA_REVIEW",
  "EDITOR_REVIEW",
  "REVISION",
  "EDITOR_APPROVED",
  "READY_FOR_PUBLICATION",
  "SCHEDULED",
  "PUBLISHED",
] as const;

/** Statuses that count as "done" for a chapter */
export const CHAPTER_TERMINAL_STATUSES = new Set([
  "PUBLISHED",
  "EDITOR_APPROVED", // final editorial step
  "READY_FOR_PUBLICATION",
  "SCHEDULED",
]);

/** Statuses that count as "in review" */
export const CHAPTER_REVIEW_STATUSES = new Set(["MANGAKA_REVIEW", "EDITOR_REVIEW"]);

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

export const PAGE_STATUS_LABEL: Record<PageStatus, string> = {
  PENDING_UPLOAD: "Pending Upload",
  UPLOADED: "Uploaded",
  REGIONING: "Regioning",
  IN_PRODUCTION: "In Production",
  MANGAKA_REVIEW: "Mangaka Review",
  REVISION_REQUIRED: "Revision Required",
  READY_FOR_EDITOR_REVIEW: "Ready for Editor Review",
  EDITOR_APPROVED: "Editor Approved",
  FINALIZED: "Finalized",
};

// ---------------------------------------------------------------------------
// StudioTask
// ---------------------------------------------------------------------------

export const STUDIO_TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "SUBMITTED",
  "MANGAKA_REVIEWING",
  "MANGAKA_REVISION_REQUESTED",
  "MANGAKA_APPROVED",
  "EDITOR_REVIEWING",
  "EDITOR_REVISION_REQUESTED",
  "EDITOR_APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;

export type StudioTaskStatusV2 = (typeof STUDIO_TASK_STATUSES)[number];

export type TaskStatusLabelKey = StudioTaskStatusV2;

export const TASK_STATUS_LABEL: Record<TaskStatusLabelKey, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  MANGAKA_REVIEWING: "Mangaka Reviewing",
  MANGAKA_REVISION_REQUESTED: "Revision Requested",
  MANGAKA_APPROVED: "Mangaka Approved",
  EDITOR_REVIEWING: "Editor Reviewing",
  EDITOR_REVISION_REQUESTED: "Editor Revision Requested",
  EDITOR_APPROVED: "Editor Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

/** Task is considered "done" (eligible for earning) */
export const TASK_DONE_STATUSES = new Set(["EDITOR_APPROVED"]);

/** Task is in an active/pending state (still needs work) */
export const TASK_ACTIVE_STATUSES = new Set([
  "TODO",
  "IN_PROGRESS",
  "SUBMITTED",
  "MANGAKA_REVIEWING",
  "MANGAKA_REVISION_REQUESTED",
  "MANGAKA_APPROVED",
  "EDITOR_REVIEWING",
  "EDITOR_REVISION_REQUESTED",
]);

/** Task is terminal and cannot change */
export const TASK_TERMINAL_STATUSES = new Set(["EDITOR_APPROVED", "REJECTED", "CANCELLED"]);

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------

export const SUBMISSION_STATUSES = [
  "PENDING",
  "MANGAKA_APPROVED",
  "MANGAKA_REVISION_REQUESTED",
  "EDITOR_APPROVED",
  "EDITOR_REVISION_REQUESTED",
  "REJECTED",
  "SUPERSEDED",
] as const;

export type SubmissionStatusV2 = (typeof SUBMISSION_STATUSES)[number];

export type SubmissionStatusLabelKey =
  | SubmissionStatusV2
  | "SUBMITTED"
  | "APPROVED"
  | "REVISION_REQUESTED";

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatusLabelKey, string> = {
  PENDING: "Pending Review",
  MANGAKA_APPROVED: "Mangaka Approved",
  MANGAKA_REVISION_REQUESTED: "Revision Requested",
  EDITOR_APPROVED: "Editor Approved",
  EDITOR_REVISION_REQUESTED: "Editor Revision Requested",
  REJECTED: "Rejected",
  SUPERSEDED: "Superseded",
  // Legacy
  SUBMITTED: "Pending Review",
  APPROVED: "Editor Approved",
  REVISION_REQUESTED: "Revision Requested",
};

/** Submission is fully approved and eligible for earning */
export const SUBMISSION_APPROVED_STATUSES = new Set(["EDITOR_APPROVED"]);

/** Submission needs action from Mangaka or Editor */
export const SUBMISSION_NEEDS_REVIEW_STATUSES = new Set(["PENDING", "MANGAKA_APPROVED"]);

// ---------------------------------------------------------------------------
// Proposal
// ---------------------------------------------------------------------------

export const PROPOSAL_STATUSES = [
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
] as const;

export type ProposalStatusV2 = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatusV2, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PENDING_EDITOR: "Awaiting Editor",
  EDITOR_REVIEWING: "Editor Reviewing",
  CHANGES_REQUESTED: "Changes Requested",
  RESUBMITTED: "Resubmitted",
  PENDING_BOARD: "Pending Board",
  BOARD_VOTING: "Board Voting",
  TIE_BREAK: "Tie Break",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------

export const SERIES_STATUSES = ["PLANNING", "ONGOING", "HIATUS", "COMPLETED"] as const;

export type ProductionSeriesStatusV2 = (typeof SERIES_STATUSES)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if a task is effectively "done" (eligible for earning).
 */
export function isTaskDone(status: string): boolean {
  return TASK_DONE_STATUSES.has(status as StudioTaskStatusV2);
}

/**
 * Returns true if a chapter status is in review (either role).
 */
export function isChapterInReview(status: string): boolean {
  return CHAPTER_REVIEW_STATUSES.has(status);
}
