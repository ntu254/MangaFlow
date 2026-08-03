import type { IconName } from "@/design/icons"
import type { Tone } from "@/domain/workflow"
import { formatWorkflowTimestamp } from "@/domain/timestamp"
import type { EditorHistoryItem } from "@/services/editor-mobile-data-source"

// Personal Editor activity is projected only from actor-scoped backend audit
// entries. Board governance keeps its separate decision-ledger model.
export type EditorWorkflowArea = "Proposal review" | "Chapter review" | "Comments" | "Publication"

export interface EditorActivityItem {
  id: string
  action: string
  subject: string
  area: EditorWorkflowArea
  outcome: string | null
  occurredAt: string | null
  timeLabel: string
  tone: Tone
  icon: IconName
}

interface ActivityDescriptor {
  action: string
  tone: Tone
  icon: IconName
}

const AREA_LABEL: Record<EditorHistoryItem["area"], EditorWorkflowArea> = {
  PROPOSAL: "Proposal review",
  CHAPTER: "Chapter review",
  COMMENT: "Comments",
  PUBLICATION: "Publication",
}

const ACTIVITY_BY_ACTION: Record<string, ActivityDescriptor> = {
  PROPOSAL_CLAIMED: { action: "Claimed a proposal for review", tone: "primary", icon: "file-text" },
  PROPOSAL_CHANGES_REQUESTED: { action: "Requested proposal changes", tone: "warning", icon: "alert-circle" },
  PROPOSAL_FORWARDED_TO_BOARD: { action: "Forwarded a proposal to the Board", tone: "success", icon: "file-check" },
  "proposal.release_claim": { action: "Released a proposal claim", tone: "neutral", icon: "circle" },
  "proposal.update_editorial_checklist": { action: "Updated an editorial checklist", tone: "primary", icon: "file-check" },
  "proposal.reject": { action: "Rejected a proposal", tone: "danger", icon: "alert-triangle" },
  CHAPTER_TANTOU_REVISION_REQUESTED: { action: "Requested a chapter revision", tone: "warning", icon: "alert-circle" },
  CHAPTER_TANTOU_REJECTED: { action: "Rejected a chapter", tone: "danger", icon: "alert-triangle" },
  CHAPTER_MARKED_READY: { action: "Approved a chapter for publication", tone: "success", icon: "check-circle" },
  "comment.create": { action: "Added an editorial comment", tone: "primary", icon: "message-circle" },
  "comment.reply": { action: "Replied to an editorial comment", tone: "primary", icon: "message-circle" },
  "comment.resolved": { action: "Resolved an editorial comment", tone: "success", icon: "message-circle" },
  "comment.reopened": { action: "Reopened an editorial comment", tone: "warning", icon: "message-circle" },
  PUBLICATION_SCHEDULED: { action: "Scheduled a chapter for publication", tone: "primary", icon: "calendar" },
  CHAPTER_POSTPONED: { action: "Postponed a chapter publication", tone: "warning", icon: "calendar" },
  CHAPTER_PUBLISHED: { action: "Published a chapter", tone: "success", icon: "check-circle" },
}

const OUTCOME_LABEL: Record<string, string> = {
  EDITOR_REVIEWING: "Editorial review in progress",
  CHANGES_REQUESTED: "Changes requested",
  PENDING_BOARD: "Waiting on the Board",
  REJECTED: "Rejected",
  REVISION_REQUIRED: "Revision required",
  READY_FOR_PUBLICATION: "Ready for publication",
  OPEN: "Open",
  RESOLVED: "Resolved",
  REOPENED: "Reopened",
  SCHEDULED: "Scheduled",
  POSTPONED: "Postponed",
  PUBLISHED: "Published",
}

function humanize(value: string): string {
  const spaced = value.replace(/[._-]+/g, " ").toLowerCase().trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function toEditorActivityItem(row: EditorHistoryItem): EditorActivityItem {
  const descriptor = ACTIVITY_BY_ACTION[row.action]
  return {
    id: row.id,
    action: descriptor?.action ?? humanize(row.action),
    subject: row.subject,
    area: AREA_LABEL[row.area],
    outcome: row.outcome ? OUTCOME_LABEL[row.outcome] ?? humanize(row.outcome) : null,
    occurredAt: row.occurredAt,
    timeLabel: formatWorkflowTimestamp(row.occurredAt),
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
}

export function groupEditorActivities(items: EditorActivityItem[]) {
  const groups = new Map<EditorWorkflowArea, EditorActivityItem[]>()
  for (const item of items) groups.set(item.area, [...(groups.get(item.area) ?? []), item])
  return Array.from(groups, ([area, groupedItems]) => ({ id: area, title: GROUP_TITLE_BY_AREA[area], items: groupedItems }))
}
