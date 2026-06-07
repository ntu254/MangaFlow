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

export function getStatusUi(status: string, mapping: Record<string, StatusUiConfig>): StatusUiConfig {
  return mapping[status] ?? { label: status, tone: "neutral" }
}
