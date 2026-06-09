import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFTable, type MFTableColumn } from "@/shared/components/ui"
import { StatusBadge, TaskStatusBadge } from "@/shared/components/domain"
import { taskPriorityUI } from "@/shared/lib/status-ui"
import type { TaskRow } from "../utils/task-page.mappers"

const taskColumns: MFTableColumn<TaskRow>[] = [
  {
    id: "task",
    header: "Task",
    cell: (task) => (
      <div className="min-w-0">
        <p className="break-words text-label-md text-on-surface">{task.title}</p>
        <p className="mt-xs break-words text-label-sm text-on-surface-muted">
          {task.series}
        </p>
      </div>
    ),
  },
  {
    id: "scope",
    header: "Scope",
    cell: (task) => task.scope,
  },
  {
    id: "status",
    header: "Status",
    cell: (task) => <TaskStatusBadge status={task.status} />,
  },
  {
    id: "priority",
    header: "Priority",
    cell: (task) => <StatusBadge status={task.priority} mapping={taskPriorityUI} />,
  },
  {
    id: "due",
    header: "Due",
    cell: (task) => task.dueDate,
  },
  {
    id: "assignee",
    header: "Assignee",
    cell: (task) => task.assignee,
  },
]

interface TaskListPanelProps {
  rows: TaskRow[]
  loading: boolean
  error: string
  onRetry: () => void
}

export function TaskListPanel({ rows, loading, error, onRetry }: TaskListPanelProps) {
  if (error) {
    return (
      <MFErrorState
        title="Could not load tasks"
        description={error}
        onRetry={onRetry}
      />
    )
  }

  return (
    <MFTable
      caption="Production task list"
      rows={rows}
      columns={taskColumns}
      getRowKey={(task) => task.id}
      loading={loading}
      emptyTitle="No production tasks"
      emptyDescription="Tasks appear here when the backend returns records assigned to the current user."
    />
  )
}
