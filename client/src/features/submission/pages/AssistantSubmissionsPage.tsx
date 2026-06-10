
import { useEffect, useState } from "react"
import { useAuth } from "@/shared/components/auth/AuthProvider"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { listTasksByAssignee, getTaskSubmissions, type Task, type SubmissionVersion } from "@/features/task/api/task.api"

function statusTone(status: string) {
  if (["EDITOR_APPROVED", "MANGAKA_APPROVED"].includes(status)) return "success"
  if (["SUBMITTED"].includes(status)) return "primary"
  if (["REVISION_REQUESTED", "REJECTED"].includes(status)) return "warning"
  return "neutral"
}

export function AssistantSubmissionsPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [submissionsByTask, setSubmissionsByTask] = useState<Record<string, SubmissionVersion[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  usePageTitle("My Submissions", "Track your submitted work and review statuses.")

  async function load() {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    const res = await listTasksByAssignee(user.id)
    if (!res.success) { setError(res.message ?? "Could not load tasks"); setLoading(false); return }
    const taskList = res.data ?? []
    setTasks(taskList)
    const subMap: Record<string, SubmissionVersion[]> = {}
    for (const task of taskList) {
      const tid = task.id ?? task._id ?? ""
      const sres = await getTaskSubmissions(tid)
      if (sres.success && sres.data) subMap[tid] = sres.data
    }
    setSubmissionsByTask(subMap)
    setLoading(false)
  }

  useEffect(() => { void load() }, [user?.id])

  const allSubs = Object.entries(submissionsByTask).flatMap(([tid, subs]) => subs.map(s => ({ ...s, taskId: tid })))
  const hasData = tasks.length > 0 || allSubs.length > 0

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <MFBadge tone="primary">Assistant</MFBadge>
        <h1 className="mt-md text-headline-lg text-on-surface">My submitted work</h1>
        <p className="mt-sm text-body-md text-on-surface-muted">Backend filters these to your own tasks and submissions.</p>
      </MFCard>
      {loading ? <MFCard><MFSkeleton className="h-40 w-full" /></MFCard> : null}
      {error ? <MFErrorState title="Could not load submissions" description={error} onRetry={() => void load()} /> : null}
      {!loading && !error && !hasData ? <MFEmptyState icon="assignment_turned_in" title="No submissions yet" description="Submissions appear after you submit work on assigned tasks." /> : null}
      {!loading && !error && hasData ? (
        <div className="grid gap-md">
          {tasks.map(task => {
            const tid = task.id ?? task._id ?? ""
            const subs = submissionsByTask[tid] ?? []
            return (
              <MFCard key={tid}>
                <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-title-md text-on-surface">{task.title}</p>
                    <p className="text-body-sm text-on-surface-muted">Task {tid}</p>
                  </div>
                  <MFBadge tone={statusTone(task.status)}>{task.status}</MFBadge>
                </div>
                {subs.length > 0 ? (
                  <div className="mt-md grid gap-sm">
                    {subs.map(sub => (
                      <div key={sub.id ?? sub._id ?? ""} className="flex items-center justify-between rounded-xl bg-surface-container p-sm">
                        <span className="text-body-sm text-on-surface">v{sub.version} — {sub.status}</span>
                        <MFBadge tone={statusTone(sub.status)} size="sm">{sub.status}</MFBadge>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-md text-body-sm text-on-surface-muted">No submissions yet.</p>}
              </MFCard>
            )
          })}
        </div>
      ) : null}
    </PageShell>
  )
}
