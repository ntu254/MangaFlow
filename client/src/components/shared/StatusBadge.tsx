import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
  SeriesStatus,
  ChapterStatus,
  TaskStatus,
  PageStatus,
  UserStatus,
  UserRole,
  TaskPriority,
} from "@/types"

type AnyStatus =
  | SeriesStatus
  | ChapterStatus
  | TaskStatus
  | PageStatus
  | UserStatus
  | string

type Variant =
  | "default"
  | "outline"
  | "solid"
  | "violet"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "review"
  | "board"
  | "ai"
  | "task"
  | "draft"

const STATUS_TONE: Record<string, { variant: Variant; label?: string; withDot?: boolean }> = {
  // Series
  DRAFT: { variant: "draft", label: "Draft" },
  SUBMITTED: { variant: "info", label: "Submitted" },
  EDITOR_REVIEW: { variant: "review", label: "Editor review" },
  REVISION_REQUESTED: { variant: "warning", label: "Revision requested" },
  BOARD_REVIEW: { variant: "board", label: "Board review" },
  APPROVED: { variant: "success", label: "Approved" },
  ONGOING: { variant: "success", label: "Ongoing" },
  AT_RISK: { variant: "warning", label: "At risk" },
  CANCELLED: { variant: "destructive", label: "Cancelled" },
  COMPLETED: { variant: "default", label: "Completed" },
  REJECTED: { variant: "destructive", label: "Rejected" },
  // Chapter
  IN_PRODUCTION: { variant: "info", label: "In production" },
  READY_FOR_PUBLICATION: { variant: "success", label: "Ready" },
  PUBLISHED: { variant: "solid", label: "Published" },
  // Pages
  PENDING: { variant: "draft", label: "Pending" },
  UPLOADED: { variant: "info", label: "Uploaded" },
  PROCESSING: { variant: "warning", label: "Processing" },
  READY: { variant: "success", label: "Ready" },
  // Tasks
  TODO: { variant: "draft", label: "To do" },
  IN_PROGRESS: { variant: "task", label: "In progress" },
  MANGAKA_APPROVED: { variant: "success", label: "Mangaka approved" },
  EDITOR_APPROVED: { variant: "success", label: "Editor approved" },
  // Users
  ACTIVE: { variant: "success", label: "Active" },
  SUSPENDED: { variant: "destructive", label: "Suspended" },
  PENDING_INVITE: { variant: "warning", label: "Pending invite" },
  INACTIVE: { variant: "default", label: "Inactive" },
}

interface StatusBadgeProps {
  status: AnyStatus
  className?: string
  showDot?: boolean
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const meta = STATUS_TONE[status] ?? { variant: "default" as Variant, label: String(status) }
  return (
    <Badge variant={meta.variant} className={cn(className)}>
      {showDot && <span className="status-dot opacity-80" />}
      {meta.label ?? status}
    </Badge>
  )
}

const ROLE_TONE: Record<UserRole, Variant> = {
  ADMIN: "solid",
  MANGAKA: "violet",
  ASSISTANT: "task",
  EDITOR: "review",
  BOARD: "board",
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge variant={ROLE_TONE[role]}>
      <span className="status-dot opacity-80" />
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </Badge>
  )
}

const PRIORITY_TONE: Record<TaskPriority, Variant> = {
  LOW: "default",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "destructive",
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant={PRIORITY_TONE[priority]}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </Badge>
  )
}
