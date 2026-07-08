import type { StudioTask, StudioTaskStatus } from "@/entities/series/model/studio-types";

export type VisualTaskStatus =
  | StudioTaskStatus
  | "BLOCKED"
  | "OVERDUE"
  | "REASSIGNED"
  | "CANCELLED";

type UnknownTask = Partial<StudioTask> & Record<string, unknown>;

const CLOSED_STATUSES: StudioTaskStatus[] = [
  "EDITOR_APPROVED",
  "MANGAKA_APPROVED",
  "REJECTED",
  "CANCELLED",
];

function asTask(task: unknown): UnknownTask {
  return task && typeof task === "object" ? (task as UnknownTask) : {};
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function isTaskOverdue(task: unknown): boolean {
  const data = asTask(task);
  const dueAt = stringOrNull(data.dueAt ?? data.dueDate);
  if (!dueAt) return false;
  const status = data.status as StudioTaskStatus | undefined;
  if (status && CLOSED_STATUSES.includes(status)) return false;
  const due = new Date(dueAt).getTime();
  return Number.isFinite(due) && due < Date.now();
}

export function getTaskBlockedReason(task: unknown): string | null {
  const data = asTask(task);
  return stringOrNull(data.blockedReason ?? data.blockerReason ?? data.waitingReason);
}

export function getTaskReassignmentSummary(task: unknown): string | null {
  const data = asTask(task);
  const from = stringOrNull(data.reassignedFromName ?? data.reassignedFrom);
  const to = stringOrNull(data.reassignedToName ?? data.assigneeName);
  const reason = stringOrNull(data.reassignmentReason);
  const date = stringOrNull(data.reassignedAt);
  if (!from && !reason && !date) return null;
  const move = from && to ? `Reassigned from ${from} to ${to}` : "Task reassigned";
  const parts = [
    move,
    reason ? `Reason: ${reason}` : null,
    date ? `Date: ${new Date(date).toLocaleDateString("vi-VN")}` : null,
  ];
  return parts.filter(Boolean).join(" · ");
}

export function getVisualTaskStatus(task: unknown): VisualTaskStatus {
  const data = asTask(task);
  const status = data.status as StudioTaskStatus | undefined;
  const statusLike = stringOrNull(data.visualStatus ?? data.statusLike);
  if (data.cancelled === true || data.cancelledAt || statusLike === "CANCELLED") return "CANCELLED";
  if (data.reassigned === true || data.reassignedAt || data.reassignmentHistory)
    return "REASSIGNED";
  if (data.blocked === true || data.blockedBy || data.waitingFor || getTaskBlockedReason(data))
    return "BLOCKED";
  if (isTaskOverdue(data)) return "OVERDUE";
  return status ?? "TODO";
}

export function getTaskStatusLabel(status: VisualTaskStatus): string {
  return status.replace(/_/g, " ");
}

export function getTaskStatusTone(
  status: VisualTaskStatus,
): "default" | "success" | "warning" | "danger" | "muted" {
  if (status === "EDITOR_APPROVED" || status === "MANGAKA_APPROVED") return "success";
  if (
    status === "SUBMITTED" ||
    status === "IN_PROGRESS" ||
    status === "MANGAKA_REVISION_REQUESTED" ||
    status === "EDITOR_REVISION_REQUESTED" ||
    status === "REASSIGNED"
  )
    return "warning";
  if (status === "BLOCKED" || status === "OVERDUE" || status === "REJECTED") return "danger";
  if (status === "CANCELLED") return "muted";
  return "default";
}

export function getVisualTaskStatusClass(status: VisualTaskStatus): string {
  switch (getTaskStatusTone(status)) {
    case "success":
      return "bg-emerald-100 text-emerald-900 border-emerald-300";
    case "warning":
      return "bg-amber-100 text-amber-900 border-amber-300";
    case "danger":
      return "bg-rose-100 text-rose-900 border-rose-300";
    case "muted":
      return "bg-zinc-200 text-zinc-700 border-zinc-300";
    default:
      return "bg-zinc-100 text-zinc-800 border-zinc-300";
  }
}

export function getTaskEdgeSummary(task: unknown): string | null {
  const data = asTask(task);
  const visual = getVisualTaskStatus(data);
  if (visual === "BLOCKED") {
    const reason = getTaskBlockedReason(data) ?? "Blocked reason unavailable";
    const waitingFor = stringOrNull(data.waitingFor);
    const blockedBy = stringOrNull(data.blockedBy);
    return [
      reason,
      blockedBy ? `Blocked by: ${blockedBy}` : null,
      waitingFor ? `Waiting for: ${waitingFor}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (visual === "OVERDUE") {
    const dueAt = stringOrNull(data.dueAt ?? data.dueDate);
    const days = dueAt
      ? Math.max(1, Math.ceil((Date.now() - new Date(dueAt).getTime()) / 86_400_000))
      : null;
    return [
      `Due: ${dueAt ? new Date(dueAt).toLocaleDateString("vi-VN") : "—"}`,
      days ? `${days} day(s) overdue` : null,
      data.assigneeName ? `Assigned: ${data.assigneeName}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (visual === "REASSIGNED") return getTaskReassignmentSummary(data) ?? "Task reassigned";
  if (visual === "CANCELLED") return "This task has been cancelled.";
  return null;
}
