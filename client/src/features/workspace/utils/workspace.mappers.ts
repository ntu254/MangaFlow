import type { CommentThreadItem, ContextPageItem, SubmissionVersionItem } from "@/shared/components/domain"
import type { Comment, SubmissionVersion, Task } from "@/features/task/api/task.api"

export const assignedTask = {
  title: "Clean tone pass for assigned page",
  status: "IN_PROGRESS",
  scopeType: "page" as const,
  scopeLabel: "Chapter 08 - Page 12",
  description: "Presentation-only task preview for the shared workspace route. Real task data will come from the task workspace API in a future story.",
  dueDateLabel: "June 14, 2026",
  priority: "HIGH",
  assignedToLabel: "Assistant view",
  taskTypeLabel: "Tone cleanup",
}

export const fallbackContextPages: ContextPageItem[] = [
  { id: "context-page-11", pageNumber: 11, status: "APPROVED", label: "Previous beat" },
  { id: "context-page-13", pageNumber: 13, status: "UPLOADED", label: "Next beat" },
]

export function taskTypeLabel(task?: Task | null) {
  if (!task) return assignedTask.taskTypeLabel
  return typeof task.taskTypeId === "string" ? "Task type linked" : task.taskTypeId.name ?? "Task type linked"
}

export function taskToScope(task?: Task | null) {
  if (!task) return assignedTask
  return {
    title: task.title,
    status: task.status,
    scopeType: task.regionId ? "region" as const : "page" as const,
    scopeLabel: task.pageId ? `Assigned page ${task.pageId}` : `Chapter ${task.chapterId}`,
    description: task.description ?? "Backend task payload loaded for this assigned workspace.",
    dueDateLabel: new Date(task.dueDate).toLocaleDateString(),
    priority: task.priority,
    assignedToLabel: `Assistant ${task.assignedTo}`,
    taskTypeLabel: taskTypeLabel(task),
  }
}

export function contextFromTask(task?: Task | null): ContextPageItem[] {
  if (!task?.contextPageIds?.length) return fallbackContextPages
  return task.contextPageIds.map((contextPageId, index) => ({
    id: contextPageId,
    pageNumber: index + 1,
    status: "READ_ONLY",
    label: `Read-only context ${contextPageId}`,
  }))
}

export function mapCommentToThread(comment: Comment): CommentThreadItem {
  return {
    id: comment.id ?? comment._id ?? comment.taskId,
    authorName: comment.authorId?.name ?? "Unknown",
    authorRole: comment.authorId?.role,
    body: comment.body,
    status: comment.status,
    createdAt: comment.createdAt,
    targetLabel: comment.targetLabel,
    isUnresolved: comment.isUnresolved ?? (comment.status !== "RESOLVED_BY_EDITOR"),
  }
}

export function mapSubmissionToVersion(submission: SubmissionVersion, index: number): SubmissionVersionItem {
  return {
    id: submission.id ?? submission._id ?? `${submission.taskId}-${submission.version}`,
    label: `Version ${submission.version}`,
    submittedBy: submission.submittedBy?.name ?? "Unknown",
    submittedAt: submission.createdAt,
    status: submission.status,
    summary: submission.resultText,
    fileName: submission.fileAssetId?.originalName,
    isCurrent: index === 0,
  }
}
