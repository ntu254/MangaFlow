import { CommentThread, ContextPageList, SubmissionVersionList, TaskScopeCard, type CommentThreadItem, type SubmissionVersionItem } from "@/shared/components/domain"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFBadge, MFCard, MFPagePreviewCard } from "@/shared/components/ui"
import type { Task } from "@/features/task/api/task.api"
import { contextFromTask, taskToScope } from "../utils/workspace.mappers"
import { useAITranslation } from "../hooks/useAITranslation"

export function WorkspaceToolbar({ taskId, isLive }: { taskId?: string; isLive: boolean }) {
  return (
    <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-sm">
          <MFBadge tone="primary" size="md">Assistant Task Workspace</MFBadge>
          <MFBadge tone={isLive ? "success" : "warning"} size="md">{isLive ? "Task API connected" : "Awaiting task payload"}</MFBadge>
        </div>
        <p className="mt-xs break-words text-label-sm text-on-surface-muted">
          Route context id {taskId ?? "not supplied"}. This screen calls backend task access and keeps page artwork/signed URLs out of scope.
        </p>
      </div>
    </div>
  )
}

export function CanvasPanel({ task, loading, error, onRetry }: { task?: Task | null; loading: boolean; error: string; onRetry: () => void }) {
  const pageNumber = task?.pageId ? 1 : 12
  const pageStatus = task?.status ?? "IN_PROGRESS"
  const { detectBubbles, processBubbles, detecting, processing, error: aiError } = useAITranslation(task?.pageId)

  const handleDetect = async () => {
    await detectBubbles()
    onRetry() // reload task/page to get new regions
  }

  const handleProcess = async () => {
    await processBubbles()
    onRetry() // reload task/page to get variant image
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-lg">
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-start">
          <div className="w-full max-w-sm shrink-0 lg:max-w-md"><MFPagePreviewCard pageNumber={pageNumber} status={pageStatus} isSelected /></div>
          <div className="min-w-0 flex-1 space-y-lg">
            <div>
              <div className="flex flex-wrap items-center gap-sm"><MFBadge tone="primary" size="md">Assigned page</MFBadge><MFBadge tone="neutral" size="md">No full chapter access</MFBadge></div>
              <h2 className="mt-md text-headline-md text-on-surface">{task?.title ?? "Chapter 08 - Page 12"}</h2>
              <p className="mt-sm text-body-md text-on-surface-muted">{task ? "Backend task metadata is loaded through the task endpoint. Context remains explicit and read-only." : "This canvas presents the single assigned page as the primary work surface. Context is intentionally separated into read-only cards so the Assistant workspace does not expose unrelated chapter pages by default."}</p>
            </div>
            <div className="grid gap-md sm:grid-cols-2"><div className="rounded-2xl bg-surface-low p-lg"><p className="text-label-sm text-on-surface-muted">Workspace source</p><p className="mt-xs text-label-md text-on-surface">{task ? "Backend task payload" : "Local presentation fallback"}</p></div><div className="rounded-2xl bg-surface-low p-lg"><p className="text-label-sm text-on-surface-muted">Access boundary</p><p className="mt-xs text-label-md text-on-surface">Assigned page plus optional read-only context</p></div></div>
            {task?.pageId && (
              <div className="mt-lg flex items-center gap-md border-t border-surface-container pt-md">
                <button
                  onClick={handleDetect}
                  disabled={detecting || processing}
                  className="rounded-full bg-primary px-lg py-sm text-label-lg text-on-primary disabled:opacity-50"
                >
                  {detecting ? "Detecting..." : "✨ AI Detect Bubbles"}
                </button>
                <button
                  onClick={handleProcess}
                  disabled={detecting || processing}
                  className="rounded-full bg-secondary px-lg py-sm text-label-lg text-on-secondary disabled:opacity-50"
                >
                  {processing ? "Processing..." : "🧹 AI Whiten Page"}
                </button>
                {aiError && <span className="text-body-sm text-error">{aiError}</span>}
              </div>
            )}
          </div>
        </div>
      </MFCard>
      <MFCard>
        <h2 className="text-title-lg text-on-surface">Workspace states</h2>
        <p className="mt-xs text-body-md text-on-surface-muted">Preview states are represented here without triggering network requests.</p>
        <div className="mt-lg grid gap-md lg:grid-cols-3">
          <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading state preview" aria-busy={loading}><div className="h-4 w-24 rounded-full bg-surface-container" /><div className="mt-md space-y-sm"><div className="h-3 rounded-full bg-surface-container" /><div className="h-3 w-2/3 rounded-full bg-surface-container" /><div className="h-3 w-1/2 rounded-full bg-surface-container" /></div><p className="mt-md text-label-sm text-on-surface-muted">{loading ? "Loading task workspace..." : "Loading preview"}</p></div>
          <MFEmptyState icon="assignment_late" title="No task selected" description="An empty workspace stays honest until a task workspace payload is available." />
          <MFErrorState title="Workspace API unavailable" description={error || "If the backend rejects access, this state remains recoverable without exposing page data."} onRetry={onRetry} />
        </div>
      </MFCard>
    </div>
  )
}

export function LeftPanel({ task }: { task?: Task | null }) {
  return <div className="space-y-lg"><TaskScopeCard {...taskToScope(task)} /><ContextPageList pages={contextFromTask(task)} description="Only explicitly supplied context pages appear here, and each one is read-only." /></div>
}

export function RightPanel({ comments, submissions }: { comments: CommentThreadItem[]; submissions: SubmissionVersionItem[] }) {
  return <div className="space-y-lg"><CommentThread comments={comments} description="Review notes are displayed without resolve or submit actions in this story." /><SubmissionVersionList versions={submissions} description="Version history preview only. Submission mutation is reserved for an API-backed story." /></div>
}
