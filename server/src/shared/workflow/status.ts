export const USER_STATUSES = ["ACTIVE", "SUSPENDED", "DEACTIVATED"] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const SERIES_STATUSES = [
  "DRAFT",
  "EDITOR_REVIEW",
  "REVISION_REQUESTED",
  "BOARD_REVIEW",
  "APPROVED",
  "ONGOING",
  "AT_RISK",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
] as const
export type SeriesStatus = (typeof SERIES_STATUSES)[number]

export const MANUSCRIPT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_EDITOR_REVIEW",
  "REVISION_REQUESTED",
  "FORWARDED_TO_BOARD",
  "APPROVED",
  "REJECTED",
] as const
export type ManuscriptStatus = (typeof MANUSCRIPT_STATUSES)[number]

export const PUBLICATION_TYPES = ["WEEKLY", "MONTHLY"] as const
export type PublicationType = (typeof PUBLICATION_TYPES)[number]

export const CHAPTER_STATUSES = [
  "DRAFT",
  "IN_PRODUCTION",
  "IN_REVIEW",
  "READY_FOR_PUBLICATION",
  "PUBLISHED",
  "REVISION_REQUIRED",
] as const
export type ChapterStatus = (typeof CHAPTER_STATUSES)[number]

export const PAGE_STATUSES = [
  "UPLOADING",
  "UPLOADED",
  "PROCESSING_FAILED",
  "TASK_ASSIGNED",
  "IN_PROGRESS",
  "UNDER_REVIEW",
  "APPROVED",
] as const
export type PageStatus = (typeof PAGE_STATUSES)[number]

export const REGION_STATUSES = [
  "CREATED",
  "AI_SUGGESTED",
  "ACCEPTED",
  "REJECTED",
  "LINKED_TO_TASK",
  "ARCHIVED"
] as const
export type RegionStatus = (typeof REGION_STATUSES)[number]

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "SUBMITTED",
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "REVISION_REQUESTED",
  "REJECTED",
  "CANCELLED",
] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const SUBMISSION_STATUSES = [
  "SUBMITTED",
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "REVISION_REQUESTED",
  "REJECTED",
] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

export const COMMENT_STATUSES = [
  "OPEN",
  "FIXED_BY_ASSISTANT",
  "VERIFIED_BY_MANGAKA",
  "RESOLVED_BY_EDITOR",
] as const
export type CommentStatus = (typeof COMMENT_STATUSES)[number]

export const BOARD_VOTE_VALUES = ["APPROVE", "REJECT", "NEEDS_REVISION"] as const
export type BoardVoteValue = (typeof BOARD_VOTE_VALUES)[number]

export const BOARD_DECISION_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "NEEDS_REVISION",
  "TIE_BREAK_REQUIRED",
  "FINALIZED",
] as const
export type BoardDecisionStatus = (typeof BOARD_DECISION_STATUSES)[number]

export const RANKING_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "FINALIZED",
  "VOIDED",
] as const
export type RankingStatus = (typeof RANKING_STATUSES)[number]

export const AT_RISK_DECISIONS = [
  "CONTINUE",
  "WARNING",
  "REQUEST_IMPROVEMENT_PLAN",
  "CANCEL",
] as const
export type AtRiskDecision = (typeof AT_RISK_DECISIONS)[number]

export const ASSISTANT_EARNING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PAID",
  "VOID",
] as const
export type AssistantEarningStatus = (typeof ASSISTANT_EARNING_STATUSES)[number]

export const TASK_CURRENCIES = ["POINT", "VND"] as const
export type TaskCurrency = (typeof TASK_CURRENCIES)[number]

export const TASK_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export function isSeriesStatus(value: string): value is SeriesStatus {
  return SERIES_STATUSES.includes(value as SeriesStatus)
}
