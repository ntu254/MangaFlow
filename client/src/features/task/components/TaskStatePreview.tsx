import { MFBadge, MFCard } from "@/shared/components/ui"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { TaskStatusBadge } from "@/shared/components/domain"

export function TaskStatePreview() {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="text-title-lg text-on-surface">Task states</h2>
          <p className="mt-xs text-body-md text-on-surface-muted">
            UI-only previews for loading, empty, error, submitted, and revision states.
          </p>
        </div>
        <MFBadge tone="success" size="md">
          Task type API connected
        </MFBadge>
      </div>
      <div className="mt-lg grid gap-md xl:grid-cols-4">
        <div className="rounded-3xl bg-surface-low p-lg" aria-label="Loading tasks preview">
          <div className="h-4 w-28 rounded-full bg-surface-container" />
          <div className="mt-md space-y-sm">
            <div className="h-3 rounded-full bg-surface-container" />
            <div className="h-3 w-2/3 rounded-full bg-surface-container" />
            <div className="h-3 w-1/2 rounded-full bg-surface-container" />
          </div>
          <p className="mt-md text-label-sm text-on-surface-muted">Loading preview</p>
        </div>
        <MFEmptyState
          icon="task"
          title="No tasks assigned"
          description="The live task list will stay empty until the task API supplies records."
        />
        <MFErrorState
          title="Could not load tasks"
          description="Future API failures should remain recoverable and avoid raw stack traces."
          onRetry={() => undefined}
        />
        <div className="rounded-3xl bg-surface-low p-lg">
          <div className="flex flex-wrap gap-sm">
            <TaskStatusBadge status="SUBMITTED" />
            <TaskStatusBadge status="REVISION_REQUESTED" />
          </div>
          <p className="mt-md text-body-md text-on-surface">
            Submitted and revision states stay text-visible and do not rely on color alone.
          </p>
        </div>
      </div>
    </MFCard>
  )
}
