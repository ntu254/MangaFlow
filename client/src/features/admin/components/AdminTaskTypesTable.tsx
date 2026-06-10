import { MFButton, MFBadge, MFTable, type MFTableColumn } from "@/shared/components/ui"
import type { AdminTaskType } from "../api/admin.api"

interface AdminTaskTypesTableProps {
  taskTypes: AdminTaskType[]
  loading: boolean
  updatingTaskTypeId: string
  onEdit: (taskType: AdminTaskType) => void
  onStatusChange: (taskType: AdminTaskType) => void
  onDelete: (taskType: AdminTaskType) => void
}

export function AdminTaskTypesTable({ taskTypes, loading, updatingTaskTypeId, onEdit, onStatusChange, onDelete }: AdminTaskTypesTableProps) {
  const columns = taskTypeColumns({ updatingTaskTypeId, onEdit, onStatusChange, onDelete })

  return (
    <MFTable
      caption="Admin task types"
      rows={taskTypes}
      columns={columns}
      getRowKey={(taskType) => taskType.id}
      loading={loading}
      emptyTitle="No task types found"
      emptyDescription="Create task types here so assignment dialogs can use backend-owned workflow configuration."
    />
  )
}

interface TaskTypeColumnsInput {
  updatingTaskTypeId: string
  onEdit: (taskType: AdminTaskType) => void
  onStatusChange: (taskType: AdminTaskType) => void
  onDelete: (taskType: AdminTaskType) => void
}

function taskTypeColumns({ updatingTaskTypeId, onEdit, onStatusChange, onDelete }: TaskTypeColumnsInput): MFTableColumn<AdminTaskType>[] {
  return [
    {
      id: "taskType",
      header: "Task type",
      cell: (taskType) => (
        <div>
          <p className="break-words text-label-md text-on-surface">{taskType.name}</p>
          <p className="mt-xs max-w-xl text-label-sm text-on-surface-muted">{taskType.description}</p>
        </div>
      ),
    },
    {
      id: "baseRate",
      header: "Base rate",
      cell: (taskType) => <span className="text-label-md text-on-surface">{taskType.baseRate.toLocaleString()}</span>,
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
        <div className="flex flex-wrap justify-end gap-sm">
          <MFButton type="button" variant="outline" size="sm" onClick={() => onEdit(taskType)}>
            Edit
          </MFButton>
          <MFButton type="button" variant="outline" size="sm" loading={updatingTaskTypeId === taskType.id} onClick={() => onStatusChange(taskType)}>
            {taskType.isActive ? "Deactivate" : "Activate"}
          </MFButton>
          <MFButton type="button" variant="danger" size="sm" loading={updatingTaskTypeId === taskType.id} onClick={() => onDelete(taskType)}>
            Delete
          </MFButton>
        </div>
      ),
    },
  ]
}

