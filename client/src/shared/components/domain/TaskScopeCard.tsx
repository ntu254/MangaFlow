import { MFCard } from "@/shared/components/ui/MFCard"
import { taskPriorityUI, taskStatusUI, type StatusUiConfig } from "@/shared/lib/status-ui"
import { StatusBadge } from "./StatusBadge"

export type TaskScopeType = "page" | "region"

export interface TaskScopeCardProps {
  title: string
  status: string
  scopeType: TaskScopeType
  scopeLabel: string
  description?: string
  dueDateLabel?: string
  priority?: string
  assignedToLabel?: string
  taskTypeLabel?: string
  statusMapping?: Record<string, StatusUiConfig>
  priorityMapping?: Record<string, StatusUiConfig>
}

const scopeTypeLabel: Record<TaskScopeType, string> = {
  page: "Page-level task",
  region: "Region-level task",
}

export function TaskScopeCard({
  title,
  status,
  scopeType,
  scopeLabel,
  description,
  dueDateLabel,
  priority,
  assignedToLabel,
  taskTypeLabel,
  statusMapping = taskStatusUI,
  priorityMapping = taskPriorityUI,
}: TaskScopeCardProps) {
  return (
    <MFCard>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-sm">
            <h2 className="break-words text-title-lg text-on-surface">{title}</h2>
            <StatusBadge status={status} mapping={statusMapping} />
          </div>
          {description ? (
            <p className="mt-xs break-words text-body-md text-on-surface-muted">
              {description}
            </p>
          ) : null}
        </div>
        {priority ? (
          <StatusBadge status={priority} mapping={priorityMapping} size="md" />
        ) : null}
      </div>

      <dl className="mt-lg grid gap-md sm:grid-cols-2">
        <div className="rounded-xl bg-surface-low p-md">
          <dt className="text-label-sm text-on-surface-muted">Scope</dt>
          <dd className="mt-xs text-label-md text-on-surface">
            {scopeTypeLabel[scopeType]} - {scopeLabel}
          </dd>
        </div>
        {taskTypeLabel ? (
          <div className="rounded-xl bg-surface-low p-md">
            <dt className="text-label-sm text-on-surface-muted">Task type</dt>
            <dd className="mt-xs text-label-md text-on-surface">{taskTypeLabel}</dd>
          </div>
        ) : null}
        {assignedToLabel ? (
          <div className="rounded-xl bg-surface-low p-md">
            <dt className="text-label-sm text-on-surface-muted">Assigned assistant</dt>
            <dd className="mt-xs text-label-md text-on-surface">{assignedToLabel}</dd>
          </div>
        ) : null}
        {dueDateLabel ? (
          <div className="rounded-xl bg-surface-low p-md">
            <dt className="text-label-sm text-on-surface-muted">Due date</dt>
            <dd className="mt-xs text-label-md text-on-surface">{dueDateLabel}</dd>
          </div>
        ) : null}
      </dl>
    </MFCard>
  )
}
