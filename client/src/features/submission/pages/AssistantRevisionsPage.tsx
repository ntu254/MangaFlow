
import { useEffect, useState } from "react"
import { useAuth } from "@/shared/components/auth/AuthProvider"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { listTasksByAssignee, getTaskSubmissions, type Task, type SubmissionVersion } from "@/features/task/api/task.api"


export function AssistantRevisionsPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [revisions, setRevisions] = useState<Array<SubmissionVersion & { taskTitle: string; taskId: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  usePageTitle("Revisions", "Manage revision requests and resubmit updated work.")

  async function load() {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    const res = await listTasksByAssignee(user.id)
    if (!res.success) { setError(res.message ?? "Could not load tasks"); setLoading(false); return }
    const taskList = res.data ?? []
    setTasks(taskList)
    const revs: Array<SubmissionVersion & { taskTitle: string; taskId: string }> = []
    for (const task of taskList) {
      const tid = task.id ?? task._id ?? ""
      const sres = await getTaskSubmissions(tid)
      if (sres.success && sres.data) {
        const needRevision = sres.data.filter(s => s.status === "REVISION_REQUESTED")
        revs.push(...needRevision.map(s => ({ ...s, taskId: tid, taskTitle: task.title })))
      }
    }
    setRevisions(revs)
    setLoading(false)
  }

  useEffect(() => { void load() }, [user?.id])

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <MFBadge tone="primary">Assistant</MFBadge>
        <h1 className="mt-md text-headline-lg text-on-surface">Revision requests</h1>
        <p className="mt-sm text-body-md text-on-surface-muted">Submissions flagged for revision appear here. Rewrite and resubmit through the task workspace.</p>
      </MFCard>
      {loading ? <MFCard><MFSkeleton className="h-40 w-full" /></MFCard> : null}
      {error ? <MFErrorState title="Could not load revisions" description={error} onRetry={() => void load()} /> : null}
      {!loading && !error && revisions.length === 0 && tasks.length === 0 ? <MFEmptyState icon="autorenew" title="No revision requests" description="Revisions appear when an Editor or Mangaka requests changes on your submission." /> : null}
      {!loading && !error && revisions.length === 0 && tasks.length > 0 ? <MFEmptyState icon="check_circle" title="No open revisions" description="All your submissions are either approved or pending review." /> : null}
      {!loading && !error && revisions.length > 0 ? (
        <div className="grid gap-md">
          {revisions.map(rev => (
            <MFCard key={rev.id ?? rev._id ?? `${rev.taskId}-${rev.version}`}>
              <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-title-md text-on-surface">{rev.taskTitle}</p>
                  <p className="text-body-sm text-on-surface-muted">Task {rev.taskId}</p>
                </div>
                <div className="flex items-center gap-sm">
                  <MFBadge tone="warning">v{rev.version} — {rev.status}</MFBadge>
                </div>
              </div>
              {rev.reviewerNote ? <p className="mt-md text-body-md text-on-surface-muted bg-surface-container rounded-xl p-md">Reviewer note: {rev.reviewerNote}</p> : null}
            </MFCard>
          ))}
        </div>
      ) : null}
    </PageShell>
  )
}
