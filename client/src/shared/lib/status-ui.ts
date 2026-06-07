export type StatusTone = "neutral" | "primary" | "secondary" | "success" | "warning" | "danger"

export interface StatusUiConfig {
  label: string
  tone: StatusTone
}

export const taskStatusUI: Record<string, StatusUiConfig> = {
  TODO: { label: "To Do", tone: "neutral" },
  IN_PROGRESS: { label: "In Progress", tone: "primary" },
  SUBMITTED: { label: "Submitted", tone: "secondary" },
  MANGAKA_APPROVED: { label: "Mangaka Approved", tone: "success" },
  EDITOR_APPROVED: { label: "Editor Approved", tone: "success" },
  REVISION_REQUESTED: { label: "Revision", tone: "warning" },
  REJECTED: { label: "Rejected", tone: "danger" },
}

export const taskPriorityUI: Record<string, StatusUiConfig> = {
  LOW: { label: "Low Priority", tone: "neutral" },
  NORMAL: { label: "Normal Priority", tone: "primary" },
  HIGH: { label: "High Priority", tone: "warning" },
  URGENT: { label: "Urgent", tone: "danger" },
}

export const seriesStatusUI: Record<string, StatusUiConfig> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  EDITOR_REVIEW: { label: "Editor Review", tone: "primary" },
  PENDING_REVIEW: { label: "Pending Review", tone: "primary" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  ONGOING: { label: "Ongoing", tone: "success" },
  AT_RISK: { label: "At Risk", tone: "warning" },
  HIATUS: { label: "Hiatus", tone: "warning" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
}

export const chapterStatusUI: Record<string, StatusUiConfig> = {
  PLANNED: { label: "Planned", tone: "neutral" },
  IN_PRODUCTION: { label: "In Production", tone: "primary" },
  IN_REVIEW: { label: "In Review", tone: "secondary" },
  READY_FOR_PUBLICATION: { label: "Ready", tone: "success" },
  PUBLISHED: { label: "Published", tone: "success" },
  REVISION_REQUIRED: { label: "Revision Required", tone: "warning" },
}

export const pageStatusUI: Record<string, StatusUiConfig> = {
  UPLOADED: { label: "Uploaded", tone: "neutral" },
  ASSIGNED: { label: "Assigned", tone: "primary" },
  IN_PROGRESS: { label: "In Progress", tone: "primary" },
  SUBMITTED: { label: "Submitted", tone: "secondary" },
  APPROVED: { label: "Approved", tone: "success" },
  REVISION_REQUESTED: { label: "Revision", tone: "warning" },
}

export const voteStatusUI: Record<string, StatusUiConfig> = {
  PENDING: { label: "Pending", tone: "neutral" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  ABSTAIN: { label: "Abstain", tone: "neutral" },
}

export const commentStatusUI: Record<string, StatusUiConfig> = {
  OPEN: { label: "Open", tone: "danger" },
  FIXED_BY_ASSISTANT: { label: "Fixed by Assistant", tone: "primary" },
  VERIFIED_BY_MANGAKA: { label: "Verified by Mangaka", tone: "secondary" },
  RESOLVED_BY_EDITOR: { label: "Resolved by Editor", tone: "success" },
}

export const submissionStatusUI: Record<string, StatusUiConfig> = {
  SUBMITTED: { label: "Submitted", tone: "secondary" },
  MANGAKA_APPROVED: { label: "Mangaka Approved", tone: "success" },
  EDITOR_APPROVED: { label: "Editor Approved", tone: "success" },
  REVISION_REQUESTED: { label: "Revision Requested", tone: "warning" },
  REJECTED: { label: "Rejected", tone: "danger" },
}

export const boardDecisionStatusUI: Record<string, StatusUiConfig> = {
  PENDING: { label: "Pending Decision", tone: "neutral" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  TIE_BREAK_REQUIRED: { label: "Tie-break Required", tone: "warning" },
  FINALIZED: { label: "Finalized", tone: "primary" },
}

export const atRiskStatusUI: Record<string, StatusUiConfig> = {
  STABLE: { label: "Stable", tone: "success" },
  WATCHLIST: { label: "Watchlist", tone: "warning" },
  AT_RISK: { label: "At Risk", tone: "danger" },
  ESCALATED: { label: "Escalated", tone: "danger" },
  RESOLVED: { label: "Resolved", tone: "success" },
}

export const rankingStatusUI: Record<string, StatusUiConfig> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  IMPORTED: { label: "Imported", tone: "primary" },
  REVIEWED: { label: "Reviewed", tone: "secondary" },
  FINALIZED: { label: "Finalized", tone: "success" },
  FLAGGED: { label: "Flagged", tone: "warning" },
}

export function getStatusUi(status: string, mapping: Record<string, StatusUiConfig>): StatusUiConfig {
  return mapping[status] ?? { label: status, tone: "neutral" }
}
