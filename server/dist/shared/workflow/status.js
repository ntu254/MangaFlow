export const USER_STATUSES = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];
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
];
export const MANUSCRIPT_STATUSES = [
    "DRAFT",
    "SUBMITTED",
    "UNDER_EDITOR_REVIEW",
    "REVISION_REQUESTED",
    "FORWARDED_TO_BOARD",
    "APPROVED",
    "REJECTED",
];
export const PUBLICATION_TYPES = ["WEEKLY", "MONTHLY"];
export const CHAPTER_STATUSES = [
    "DRAFT",
    "IN_PRODUCTION",
    "IN_REVIEW",
    "READY_FOR_PUBLICATION",
    "PUBLISHED",
    "REVISION_REQUIRED",
];
export const PAGE_STATUSES = [
    "UPLOADED",
    "ASSIGNED",
    "IN_PROGRESS",
    "SUBMITTED",
    "APPROVED",
    "REVISION_REQUESTED",
];
export const REGION_STATUSES = ["ACTIVE", "ARCHIVED"];
export const TASK_STATUSES = [
    "TODO",
    "IN_PROGRESS",
    "SUBMITTED",
    "MANGAKA_APPROVED",
    "EDITOR_APPROVED",
    "REVISION_REQUESTED",
    "REJECTED",
    "CANCELLED",
];
export const SUBMISSION_STATUSES = [
    "SUBMITTED",
    "MANGAKA_APPROVED",
    "EDITOR_APPROVED",
    "REVISION_REQUESTED",
    "REJECTED",
];
export const COMMENT_STATUSES = [
    "OPEN",
    "FIXED_BY_ASSISTANT",
    "VERIFIED_BY_MANGAKA",
    "RESOLVED_BY_EDITOR",
];
export const BOARD_VOTE_VALUES = ["APPROVE", "REJECT", "NEEDS_REVISION"];
export const BOARD_DECISION_STATUSES = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "NEEDS_REVISION",
    "TIE_BREAK_REQUIRED",
    "FINALIZED",
];
export const RANKING_STATUSES = [
    "DRAFT",
    "IMPORTED",
    "REVIEWED",
    "FINALIZED",
    "WARNING",
    "AT_RISK",
];
export const AT_RISK_DECISIONS = [
    "CONTINUE",
    "WARNING",
    "REQUEST_IMPROVEMENT_PLAN",
    "CANCEL",
];
export const ASSISTANT_EARNING_STATUSES = [
    "PENDING",
    "CONFIRMED",
    "PAID",
    "VOID",
];
export const TASK_CURRENCIES = ["POINT", "VND"];
export const TASK_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];
export function isSeriesStatus(value) {
    return SERIES_STATUSES.includes(value);
}
//# sourceMappingURL=status.js.map