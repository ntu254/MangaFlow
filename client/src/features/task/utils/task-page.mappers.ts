import type { ActionItem, ContextPageItem } from "@/shared/components/domain"
import type { Task } from "../api/task.api"

export interface TaskRow {
  id: string
  title: string
  series: string
  scope: string
  status: string
  priority: string
  dueDate: string
  assignee: string
}

export function taskId(task: Task) {
  return task.id ?? task._id ?? `${task.chapterId}-${task.title}`
}

export function taskTypeLabel(task: Task) {
  return typeof task.taskTypeId === "string"
    ? "Task type"
    : task.taskTypeId.name ?? "Task type"
}

export function scopeLabel(task: Task) {
  if (task.regionId) return `Region ${String(task.regionId).slice(-6)}`
  if (task.pageId) return `Page ${String(task.pageId).slice(-6)}`
  return `Chapter ${String(task.chapterId).slice(-6)}`
}

export function toTaskRows(tasks: Task[], currentUserLabel: string): TaskRow[] {
  return tasks.map((task) => ({
    id: taskId(task),
    title: task.title,
    series: `Series ${String(task.seriesId).slice(-6)}`,
    scope: scopeLabel(task),
    status: task.status,
    priority: task.priority,
    dueDate: new Date(task.dueDate).toLocaleDateString(),
    assignee: currentUserLabel,
  }))
}

export function toActionItems(tasks: Task[]): ActionItem[] {
  const actionable = tasks.filter((task) => ["SUBMITTED", "REVISION_REQUESTED", "TODO", "IN_PROGRESS"].includes(task.status)).slice(0, 3)
  if (actionable.length === 0) {
    return [{
      id: "task-empty-action",
      title: "No live task actions",
      description: "Assigned task actions will appear after the backend returns actionable tasks.",
      metadata: "GET /api/tasks/assignee/:assigneeId",
      icon: "task",
      status: "TODO",
    }]
  }
  return actionable.map((task) => ({
    id: taskId(task),
    title: task.title,
    description: task.description ?? "Live task from backend assignee query.",
    metadata: `${scopeLabel(task)} - due ${new Date(task.dueDate).toLocaleDateString()}`,
    icon: task.status === "REVISION_REQUESTED" ? "edit_note" : "task",
    status: task.status,
  }))
}

export function toContextPages(task: Task | null): ContextPageItem[] {
  return (task?.contextPageIds ?? []).slice(0, 3).map((pageId, index) => ({
    id: pageId,
    pageNumber: index + 1,
    status: "UPLOADED",
    label: `Context ${String(pageId).slice(-6)}`,
  }))
}
