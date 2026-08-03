import type { IconName } from "@/design/icons"
import type { Tone } from "@/domain/workflow"
import { formatWorkflowTimestamp } from "@/domain/timestamp"
import type { EditorHistoryItem } from "@/services/editor-mobile-data-source"

// Editor-only workflow-status presentation. The source summary is not an
// actor-scoped audit feed, so this model never attributes an action to the
// signed-in Editor. Board governance records keep their separate immutable
// ledger model (see board-decision-ledger.ts).

export type EditorWorkflowArea =
  | "Proposal review"
  | "Chapter review"
  | "Comments"
  | "Publication"
  | "Editorial workflow"

export interface EditorActivityItem {
  id: string
  /** Human-readable description of the observed workflow update. */
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

const STATUS_ACTION_BY_AREA: Record<EditorWorkflowArea, string> = {
  "Proposal review": "Proposal status updated",
  "Chapter review": "Chapter status updated",
  Comments: "Comment status updated",
  Publication: "Publication status updated",
  "Editorial workflow": "Editorial workflow status updated",
}

interface ActivityDescriptor {
  area: EditorWorkflowArea
  outcome: string
  tone: Tone
  icon: IconName
}

// The Editor summary payload encodes the workflow status it reached; each known
// status maps only to its workflow area and outcome.
const ACTIVITY_BY_STATUS: Record<string, ActivityDescriptor> = {
  PENDING_EDITOR: {
    area: "Proposal review",
    outcome: "Awaiting editorial review",
    tone: "primary",
    icon: "file-text",
  },
  EDITOR_REVIEWING: {
    area: "Proposal review",
    outcome: "Editorial review in progress",
    tone: "primary",
    icon: "file-text",
  },
  CHANGES_REQUESTED: {
    area: "Proposal review",
    outcome: "Changes requested",
    tone: "warning",
    icon: "alert-circle",
  },
  RESUBMITTED: {
    area: "Proposal review",
    outcome: "Resubmitted",
    tone: "primary",
    icon: "refresh-cw",
  },
  PENDING_BOARD: {
    area: "Proposal review",
    outcome: "Waiting on the Board",
    tone: "success",
    icon: "file-check",
  },
  BOARD_VOTING: {
    area: "Proposal review",
    outcome: "Board voting",
    tone: "success",
    icon: "file-check",
  },
  APPROVED: {
    area: "Proposal review",
    outcome: "Approved",
    tone: "success",
    icon: "check-circle",
  },
  REJECTED: {
    area: "Proposal review",
    outcome: "Rejected",
    tone: "danger",
    icon: "alert-triangle",
  },
  CANCELLED: {
    area: "Proposal review",
    outcome: "Cancelled",
    tone: "neutral",
    icon: "circle",
  },
  TANTOU_REVIEW: {
    area: "Chapter review",
    outcome: "Chapter review in progress",
    tone: "primary",
    icon: "file-text",
  },
  REVISION_REQUESTED: {
    area: "Chapter review",
    outcome: "Revision requested",
    tone: "warning",
    icon: "alert-circle",
  },
  TANTOU_APPROVED: {
    area: "Chapter review",
    outcome: "Chapter approved",
    tone: "success",
    icon: "check-circle",
  },
  RESOLVED: {
    area: "Comments",
    outcome: "Resolved",
    tone: "success",
    icon: "message-circle",
  },
  REOPENED: {
    area: "Comments",
    outcome: "Reopened",
    tone: "warning",
    icon: "message-circle",
  },
  SCHEDULED: {
    area: "Publication",
    outcome: "Scheduled",
    tone: "primary",
    icon: "calendar",
  },
  PUBLISHED: {
    area: "Publication",
    outcome: "Published",
    tone: "success",
    icon: "check-circle",
  },
  POSTPONED: {
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
    // The editor dashboard summary is a global proposal-status snapshot, not
    // actor-scoped audit data. Describe only the observed status so this feed
    // cannot attribute another Editor's action to the signed-in user.
    action: descriptor ? STATUS_ACTION_BY_AREA[descriptor.area] : "Recorded editorial work",
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
