import { MFButton, MFBadge, MFTable, type MFTableColumn } from "@/shared/components/ui"
import type { AdminTaskType } from "../api/admin.api"

interface AdminTaskRatesTableProps {
  taskTypes: AdminTaskType[]
  loading: boolean
  onEdit: (taskType: AdminTaskType) => void
}

export function AdminTaskRatesTable({ taskTypes, loading, onEdit }: AdminTaskRatesTableProps) {
  return (
    <MFTable
      caption="Admin task rates"
      rows={taskTypes}
      columns={taskRateColumns(onEdit)}
      getRowKey={(taskType) => taskType.id}
      loading={loading}
      emptyTitle="No task rates found"
      emptyDescription="TaskType default base rates will appear here once backend configuration exists."
    />
  )
}

function taskRateColumns(onEdit: (taskType: AdminTaskType) => void): MFTableColumn<AdminTaskType>[] {
  return [
    {
      id: "taskType",
      header: "Task type",
      cell: (taskType) => (
        <div>
          <p className="break-words text-label-md text-on-surface">{taskType.name}</p>
          <p className="mt-xs max-w-xl text-label-sm text-on-surface-muted">
            {taskType.description}
          </p>
        </div>
      ),
    },
    {
      id: "baseRate",
      header: "Default rate",
      cell: (taskType) => (
        <div className="flex flex-col gap-xs">
          <span className="text-label-md text-on-surface">{taskType.baseRate.toLocaleString()}</span>
          {taskType.baseRate === 0 ? <MFBadge tone="warning" size="sm">Zero-rate reference</MFBadge> : null}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (taskType) => <MFBadge tone={taskType.isActive ? "success" : "danger"} size="md">{taskType.isActive ? "Active" : "Inactive"}</MFBadge>,
    },
    {
      id: "updated",
      header: "Updated",
      cell: (taskType) => taskType.updatedAt ? new Date(taskType.updatedAt).toLocaleDateString() : "Not supplied",
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: (taskType) => (
        <MFButton type="button" variant="outline" size="sm" onClick={() => onEdit(taskType)}>
          Edit rate
        </MFButton>
      ),
    },
  ]
}
