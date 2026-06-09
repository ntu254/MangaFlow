import type {
  ActionItem,
  CommentThreadItem,
  ContextPageItem,
  PublicationReadinessItem,
  SubmissionVersionItem,
} from "@/shared/components/domain"
import type { MFTableColumn } from "@/shared/components/ui"
import { StatusBadge } from "@/shared/components/domain"
import { chapterStatusUI, pageStatusUI, submissionStatusUI, taskStatusUI } from "@/shared/lib/status-ui"
import type { Page } from "../api/chapter.api"
import type { Task } from "@/features/task/api/task.api"

export interface PageRow {
  id: string
  pageNumber: number
  status: string
  file: string
  regions: string
  updatedAt: string
}

export const contextPages: ContextPageItem[] = [
  { id: "context-11", pageNumber: 11, status: "APPROVED", label: "Previous page" },
  { id: "context-12", pageNumber: 12, status: "SUBMITTED", label: "Selected page" },
  { id: "context-13", pageNumber: 13, status: "IN_PROGRESS", label: "Next page" },
]

export const comments: CommentThreadItem[] = [
  { id: "chapter-comment-1", authorName: "Rin Sato", authorRole: "Tantou Editor", body: "Keep the rain texture lighter near the speech bubble before final readiness.", status: "OPEN", createdAt: "Today 10:20", targetLabel: "Chapter 08 - Page 12", isUnresolved: true },
  { id: "chapter-comment-2", authorName: "Mika Tan", authorRole: "Mangaka", body: "Panel timing is approved for the opening sequence.", status: "RESOLVED_BY_EDITOR", createdAt: "Yesterday 17:30", targetLabel: "Chapter 08 - Page 11" },
]

export const fallbackReadinessItems: PublicationReadinessItem[] = [
  { id: "all-pages-uploaded", label: "All pages uploaded", passed: true, description: "Fallback sample only when chapter readiness API is unavailable." },
  { id: "tasks-approved", label: "All tasks approved", passed: false, description: "Fallback sample says one task remains submitted." },
  { id: "comments-resolved", label: "Comments resolved by Editor", passed: false, description: "Fallback sample says one comment still blocks readiness." },
  { id: "publication-schedule", label: "Publication schedule selected", passed: true, description: "Fallback sample only." },
]

export const submissionVersions: SubmissionVersionItem[] = [
  { id: "submission-v2", label: "Page 12 tone pass v2", submittedBy: "Assistant view", submittedAt: "Today 13:15", status: "SUBMITTED", summary: "Latest sample submission for review presentation.", fileName: "chapter-08-page-12-tone-v2.psd", isCurrent: true },
  { id: "submission-v1", label: "Page 12 tone pass v1", submittedBy: "Assistant view", submittedAt: "Yesterday 16:40", status: "REVISION_REQUESTED", summary: "Previous version retained to show non-overwrite history.", fileName: "chapter-08-page-12-tone-v1.psd" },
]

export const pageColumns: MFTableColumn<PageRow>[] = [
  { id: "page", header: "Page", cell: (page) => <div className="min-w-0"><p className="text-label-md text-on-surface">Page {page.pageNumber}</p><p className="mt-xs text-label-sm text-on-surface-muted">Backend metadata</p></div> },
  { id: "page-status", header: "Page status", cell: (page) => <StatusBadge status={page.status} mapping={pageStatusUI} /> },
  { id: "file", header: "File", cell: (page) => page.file },
  { id: "regions", header: "Regions", cell: (page) => page.regions },
  { id: "updated", header: "Updated", cell: (page) => page.updatedAt },
]

export function pageId(page: Page) {
  return page.id ?? page._id ?? `${page.chapterId}-${page.pageNumber}`
}

export function toPageRows(pages: Page[]): PageRow[] {
  return pages.map((page) => ({
    id: pageId(page),
    pageNumber: page.pageNumber,
    status: page.status,
    file: page.originalFileAssetId ? "Uploaded file linked" : "No file linked",
    regions: `${page.regionIds?.length ?? 0} region(s)`,
    updatedAt: new Date(page.updatedAt).toLocaleDateString(),
  }))
}

export function taskId(task: Task) {
  return task.id ?? task._id ?? `${task.chapterId}-${task.title}`
}

export function taskTypeLabel(task: Task) {
  return typeof task.taskTypeId === "string" ? "Task type linked" : task.taskTypeId.name ?? "Task type linked"
}

export function taskScopeLabel(task: Task) {
  if (task.regionId) return `Region ${String(task.regionId).slice(-6)}`
  if (task.pageId) return `Page ${String(task.pageId).slice(-6)}`
  return `Chapter ${String(task.chapterId).slice(-6)}`
}

export function toChapterActions(tasks: Task[]): ActionItem[] {
  const actionable = tasks.filter((task) => ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"].includes(task.status)).slice(0, 3)
  if (actionable.length === 0) {
    return [{
      id: "chapter-task-empty-action",
      title: "No live chapter task actions",
      description: "Task actions will appear after the backend returns active chapter tasks.",
      metadata: "GET /api/tasks/chapter/:chapterId",
      icon: "task",
      status: "TODO",
    }]
  }
  return actionable.map((task) => ({
    id: taskId(task),
    title: task.title,
    description: task.description ?? "Live chapter task from backend metadata.",
    metadata: `${taskScopeLabel(task)} - due ${new Date(task.dueDate).toLocaleDateString()}`,
    icon: task.status === "SUBMITTED" ? "rate_review" : "task",
    status: task.status,
  }))
}

export { chapterStatusUI, pageStatusUI, submissionStatusUI, taskStatusUI }
