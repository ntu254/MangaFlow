export const USER_STATUSES = ["ACTIVE", "SUSPENDED", "DEACTIVATED"] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const SERIES_STATUSES = [
  "DRAFT",
  "EDITOR_REVIEW",
  "REVISION_REQUESTED",
  "BOARD_REVIEW",
  "ONGOING",
  "AT_RISK",
  "CANCELLED",
  "COMPLETED",
  "ARCHIVED",
  "REJECTED",
  "WITHDRAWN",
] as const
export type SeriesStatus = (typeof SERIES_STATUSES)[number]

export const MANUSCRIPT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "REVISION_REQUESTED",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
] as const
export type ManuscriptStatus = (typeof MANUSCRIPT_STATUSES)[number]

export const PUBLICATION_TYPES = ["WEEKLY", "MONTHLY"] as const
export type PublicationType = (typeof PUBLICATION_TYPES)[number]

export const CHAPTER_STATUSES = [
  "DRAFT",
  "IN_PRODUCTION",
  "READY_FOR_PUBLICATION",
  "PUBLISHED",
  "ARCHIVED",
] as const
export type ChapterStatus = (typeof CHAPTER_STATUSES)[number]

export const PAGE_STATUSES = [
  "PENDING",
  "UPLOADING",
  "PROCESSING",
  "UPLOADED",
  "PROCESSING_FAILED",
  "IN_TASK",
  "APPROVED",
  "LOCKED",
] as const
export type PageStatus = (typeof PAGE_STATUSES)[number]

export const REGION_STATUSES = [
  "ACTIVE",
  "LOCKED",
  "DELETED",
] as const
export type RegionStatus = (typeof REGION_STATUSES)[number]

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVISION_REQUESTED",
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "REJECTED",
  "CANCELLED",
] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const SUBMISSION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "REVISION_REQUESTED",
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "REJECTED",
] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

export const COMMENT_STATUSES = [
  "OPEN",
  "RESOLVED",
  "REOPENED",
] as const
export type CommentStatus = (typeof COMMENT_STATUSES)[number]

export const PUBLICATION_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "PUBLISHED",
  "FAILED",
  "CANCELLED",
] as const
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number]

export const NOTIFICATION_STATUSES = ["UNREAD", "READ", "ARCHIVED"] as const
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number]

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
  "CANCEL",
  "COMPLETE",
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
