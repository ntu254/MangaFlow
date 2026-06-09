import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import {
  CommentThread,
  ContextPageList,
  SubmissionVersionList,
  TaskScopeCard,
  type CommentThreadItem,
  type ContextPageItem,
  type SubmissionVersionItem,
} from "@/shared/components/domain"
import { WorkspaceShell } from "@/shared/components/layout/WorkspaceShell"
import { MFBadge, MFCard, MFPagePreviewCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { getTask, getTaskComments, getTaskSubmissions, type Task, type Comment, type SubmissionVersion } from "@/features/task/api/task.api"

const assignedTask = {
  title: "Clean tone pass for assigned page",
  status: "IN_PROGRESS",
  scopeType: "page" as const,
  scopeLabel: "Chapter 08 - Page 12",
  description:
    "Presentation-only task preview for the shared workspace route. Real task data will come from the task workspace API in a future story.",
  dueDateLabel: "June 14, 2026",
  priority: "HIGH",
  assignedToLabel: "Assistant view",
  taskTypeLabel: "Tone cleanup",
}

const contextPages: ContextPageItem[] = [
  {
    id: "context-page-11",
    pageNumber: 11,
    status: "APPROVED",
    label: "Previous beat",
  },
  {
    id: "context-page-13",
    pageNumber: 13,
    status: "UPLOADED",
    label: "Next beat",
  },
]

function taskTypeLabel(task?: Task | null) {
  if (!task) return assignedTask.taskTypeLabel
  return typeof task.taskTypeId === "string" ? "Task type linked" : task.taskTypeId.name ?? "Task type linked"
}

function taskToScope(task?: Task | null) {
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

function contextFromTask(task?: Task | null): ContextPageItem[] {
  if (!task?.contextPageIds?.length) return contextPages
  return task.contextPageIds.map((contextPageId, index) => ({
    id: contextPageId,
    pageNumber: index + 1,
    status: "READ_ONLY",
    label: `Read-only context ${contextPageId}`,
  }))
}

function mapCommentToThread(comment: Comment): CommentThreadItem {
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

function mapSubmissionToVersion(submission: SubmissionVersion, index: number): SubmissionVersionItem {
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

function WorkspaceToolbar({ taskId, isLive }: { taskId?: string; isLive: boolean }) {
  return (
    <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-sm">
          <MFBadge tone="primary" size="md">
            Assistant Task Workspace
          </MFBadge>
          <MFBadge tone={isLive ? "success" : "warning"} size="md">
            {isLive ? "Task API connected" : "Awaiting task payload"}
          </MFBadge>
        </div>
        <p className="mt-xs break-words text-label-sm text-on-surface-muted">
          Route context id {taskId ?? "not supplied"}. This screen calls backend task access
          and keeps page artwork/signed URLs out of scope.
        </p>
      </div>
    </div>
  )
}

function CanvasPanel({ task, loading, error, onRetry }: { task?: Task | null; loading: boolean; error: string; onRetry: () => void }) {
  const pageNumber = task?.pageId ? 1 : 12
  const pageStatus = task?.status ?? "IN_PROGRESS"

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-lg">
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-start">
          <div className="w-full max-w-sm shrink-0 lg:max-w-md">
            <MFPagePreviewCard pageNumber={pageNumber} status={pageStatus} isSelected />
          </div>

          <div className="min-w-0 flex-1 space-y-lg">
            <div>
              <div className="flex flex-wrap items-center gap-sm">
                <MFBadge tone="primary" size="md">
                  Assigned page
                </MFBadge>
                <MFBadge tone="neutral" size="md">
                  No full chapter access
                </MFBadge>
              </div>
              <h2 className="mt-md text-headline-md text-on-surface">
                {task?.title ?? "Chapter 08 - Page 12"}
              </h2>
              <p className="mt-sm text-body-md text-on-surface-muted">
                {task
                  ? "Backend task metadata is loaded through the task endpoint. Context remains explicit and read-only."
                  : "This canvas presents the single assigned page as the primary work surface. Context is intentionally separated into read-only cards so the Assistant workspace does not expose unrelated chapter pages by default."}
              </p>
            </div>

            <div className="grid gap-md sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-low p-lg">
                <p className="text-label-sm text-on-surface-muted">Workspace source</p>
                <p className="mt-xs text-label-md text-on-surface">
                  {task ? "Backend task payload" : "Local presentation fallback"}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-low p-lg">
                <p className="text-label-sm text-on-surface-muted">Access boundary</p>
                <p className="mt-xs text-label-md text-on-surface">
                  Assigned page plus optional read-only context
                </p>
              </div>
            </div>
          </div>
        </div>
      </MFCard>

      <MFCard>
        <h2 className="text-title-lg text-on-surface">Workspace states</h2>
        <p className="mt-xs text-body-md text-on-surface-muted">
          Preview states are represented here without triggering network requests.
        </p>
        <div className="mt-lg grid gap-md lg:grid-cols-3">
          <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading state preview" aria-busy={loading}>
            <div className="h-4 w-24 rounded-full bg-surface-container" />
            <div className="mt-md space-y-sm">
              <div className="h-3 rounded-full bg-surface-container" />
              <div className="h-3 w-2/3 rounded-full bg-surface-container" />
              <div className="h-3 w-1/2 rounded-full bg-surface-container" />
            </div>
            <p className="mt-md text-label-sm text-on-surface-muted">{loading ? "Loading task workspace..." : "Loading preview"}</p>
          </div>
          <MFEmptyState
            icon="assignment_late"
            title="No task selected"
            description="An empty workspace stays honest until a task workspace payload is available."
          />
          <MFErrorState
            title="Workspace API unavailable"
            description={error || "If the backend rejects access, this state remains recoverable without exposing page data."}
            onRetry={onRetry}
          />
        </div>
      </MFCard>
    </div>
  )
}

function LeftPanel({ task }: { task?: Task | null }) {
  const scope = taskToScope(task)
  const context = contextFromTask(task)

  return (
    <div className="space-y-lg">
      <TaskScopeCard {...scope} />
      <ContextPageList
        pages={context}
        description="Only explicitly supplied context pages appear here, and each one is read-only."
      />
    </div>
  )
}

function RightPanel({ comments, submissions }: { comments: CommentThreadItem[]; submissions: SubmissionVersionItem[] }) {
  return (
    <div className="space-y-lg">
      <CommentThread
        comments={comments}
        description="Review notes are displayed without resolve or submit actions in this story."
      />
      <SubmissionVersionList
        versions={submissions}
        description="Version history preview only. Submission mutation is reserved for an API-backed story."
      />
    </div>
  )
}

export function WorkspacePage() {
  const { taskId } = useParams()
  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<CommentThreadItem[]>([])
  const [submissions, setSubmissions] = useState<SubmissionVersionItem[]>([])
  const [loading, setLoading] = useState(Boolean(taskId))
  const [error, setError] = useState("")
  usePageTitle(
    "Task Workspace",
    "Assigned page workspace with read-only context and review history.",
  )

  async function loadTask() {
    if (!taskId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await getTask(taskId)
      if (!response.success || !response.data) {
        setTask(null)
        setComments([])
        setSubmissions([])
        setError(response.message ?? "Could not load task workspace.")
        return
      }
      setTask(response.data)

      // Load comments and submissions for this task
      const [commentsRes, submissionsRes] = await Promise.all([
        getTaskComments(taskId),
        getTaskSubmissions(taskId),
      ])
      if (commentsRes.success && commentsRes.data) {
        setComments(commentsRes.data.map(mapCommentToThread))
      } else {
        setComments([])
      }
      if (submissionsRes.success && submissionsRes.data) {
        setSubmissions(submissionsRes.data.map((submission, index) => mapSubmissionToVersion(submission, index)))
      } else {
        setSubmissions([])
      }
    } catch {
      setTask(null)
      setComments([])
      setSubmissions([])
      setError("Could not reach MangaFlow task workspace API.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTask()
  }, [taskId])

  const isLive = useMemo(() => Boolean(task), [task])

  return (
    <WorkspaceShell
      leftLabel="Task and context"
      canvasLabel="Assigned page canvas"
      rightLabel="Review history"
      toolbar={<WorkspaceToolbar taskId={taskId} isLive={isLive} />}
      leftPanel={<LeftPanel task={task} />}
      canvas={<CanvasPanel task={task} loading={loading} error={error} onRetry={() => void loadTask()} />}
      rightPanel={<RightPanel comments={comments} submissions={submissions} />}
      className="min-h-[calc(100vh-8rem)]"
    />
  )
}
