import type { IconName } from "@/design/icons"
import type { Tone } from "@/domain/workflow"
import { formatWorkflowTimestamp } from "@/domain/timestamp"
import type { EditorHistoryItem } from "@/services/editor-mobile-data-source"

// Editor-only presentation model: "what this Editor did". It is never used for
// Board governance records, which are an immutable audit ledger, not a personal
// activity feed (see board-decision-ledger.ts).

export type EditorWorkflowArea =
  | "Proposal review"
  | "Chapter review"
  | "Comments"
  | "Publication"
  | "Editorial workflow"

export interface EditorActivityItem {
  id: string
  /** Human-readable description of the work performed. */
  action: string
  /** The proposal/chapter the work touched. */
  subject: string
  area: EditorWorkflowArea
  /** Backend outcome/status where the payload carries one. */
  outcome: string | null
  occurredAt: string | null
  timeLabel: string
  tone: Tone
  icon: IconName
}

interface ActivityDescriptor {
  action: string
  area: EditorWorkflowArea
  outcome: string
  tone: Tone
  icon: IconName
}

// The Editor summary payload encodes the workflow status it reached; each known
// status maps to the editorial work that produced it.
const ACTIVITY_BY_STATUS: Record<string, ActivityDescriptor> = {
  PENDING_EDITOR: {
    action: "Took a proposal into editorial review",
    area: "Proposal review",
    outcome: "Awaiting editorial review",
    tone: "primary",
    icon: "file-text",
  },
  EDITOR_REVIEWING: {
    action: "Reviewed a proposal",
    area: "Proposal review",
    outcome: "Editorial review in progress",
    tone: "primary",
    icon: "file-text",
  },
  CHANGES_REQUESTED: {
    action: "Requested changes from the Mangaka",
    area: "Proposal review",
    outcome: "Changes requested",
    tone: "warning",
    icon: "alert-circle",
  },
  RESUBMITTED: {
    action: "Received a resubmitted manuscript",
    area: "Proposal review",
    outcome: "Resubmitted",
    tone: "primary",
    icon: "refresh-cw",
  },
  PENDING_BOARD: {
    action: "Forwarded a proposal to the Board",
    area: "Proposal review",
    outcome: "Waiting on the Board",
    tone: "success",
    icon: "file-check",
  },
  BOARD_VOTING: {
    action: "Forwarded a proposal to the Board",
    area: "Proposal review",
    outcome: "Board voting",
    tone: "success",
    icon: "file-check",
  },
  APPROVED: {
    action: "Completed a proposal review",
    area: "Proposal review",
    outcome: "Approved",
    tone: "success",
    icon: "check-circle",
  },
  REJECTED: {
    action: "Rejected a proposal",
    area: "Proposal review",
    outcome: "Rejected",
    tone: "danger",
    icon: "alert-triangle",
  },
  CANCELLED: {
    action: "Closed a proposal",
    area: "Proposal review",
    outcome: "Cancelled",
    tone: "neutral",
    icon: "circle",
  },
  TANTOU_REVIEW: {
    action: "Reviewed a chapter",
    area: "Chapter review",
    outcome: "Chapter review in progress",
    tone: "primary",
    icon: "file-text",
  },
  REVISION_REQUESTED: {
    action: "Requested a chapter revision",
    area: "Chapter review",
    outcome: "Revision requested",
    tone: "warning",
    icon: "alert-circle",
  },
  TANTOU_APPROVED: {
    action: "Approved a chapter",
    area: "Chapter review",
    outcome: "Chapter approved",
    tone: "success",
    icon: "check-circle",
  },
  RESOLVED: {
    action: "Resolved a blocking comment",
    area: "Comments",
    outcome: "Resolved",
    tone: "success",
    icon: "message-circle",
  },
  REOPENED: {
    action: "Reopened a comment",
    area: "Comments",
    outcome: "Reopened",
    tone: "warning",
    icon: "message-circle",
  },
  SCHEDULED: {
    action: "Scheduled a publication",
    area: "Publication",
    outcome: "Scheduled",
    tone: "primary",
    icon: "calendar",
  },
  PUBLISHED: {
    action: "Published a chapter",
    area: "Publication",
    outcome: "Published",
    tone: "success",
    icon: "check-circle",
  },
  POSTPONED: {
    action: "Postponed a publication",
    area: "Publication",
    outcome: "Postponed",
    tone: "warning",
    icon: "calendar",
  },
}

// The summary label is "<subject>: <STATUS>"; anything else is kept verbatim as
// the subject rather than guessed at.
function splitActivityLabel(label: string): { subject: string; status: string | null } {
  const separator = label.lastIndexOf(":")
  if (separator === -1) return { subject: label.trim(), status: null }
  const status = label.slice(separator + 1).trim()
  const subject = label.slice(0, separator).trim()
  if (!status || !subject) return { subject: label.trim(), status: null }
  return { subject, status }
}

function humanize(status: string): string {
  const spaced = status.replace(/[._-]+/g, " ").toLowerCase().trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function toEditorActivityItem(row: EditorHistoryItem): EditorActivityItem {
  const { subject, status } = splitActivityLabel(row.label)
  const descriptor = status ? ACTIVITY_BY_STATUS[status] : undefined

  return {
    id: row.id,
    action: descriptor?.action ?? "Recorded editorial work",
    subject,
    area: descriptor?.area ?? "Editorial workflow",
    outcome: descriptor?.outcome ?? (status ? humanize(status) : null),
    occurredAt: row.createdAt,
    timeLabel: formatWorkflowTimestamp(row.createdAt),
    tone: descriptor?.tone ?? "neutral",
    icon: descriptor?.icon ?? "shield-check",
  }
}

export function toEditorActivityItems(rows: EditorHistoryItem[]): EditorActivityItem[] {
  return rows.map(toEditorActivityItem)
}

export function editorActivityAreas(items: EditorActivityItem[]): EditorWorkflowArea[] {
  return Array.from(new Set(items.map((item) => item.area)))
}

const GROUP_TITLE_BY_AREA: Record<EditorWorkflowArea, string> = {
  "Proposal review": "Proposal reviews",
  "Chapter review": "Chapter reviews",
  Comments: "Comments",
  Publication: "Publication",
  "Editorial workflow": "Editorial workflow",
}

export function groupEditorActivities(items: EditorActivityItem[]) {
  const groups = new Map<EditorWorkflowArea, EditorActivityItem[]>()
  for (const item of items) groups.set(item.area, [...(groups.get(item.area) ?? []), item])
  return Array.from(groups, ([area, groupedItems]) => ({ id: area, title: GROUP_TITLE_BY_AREA[area], items: groupedItems }))
}
