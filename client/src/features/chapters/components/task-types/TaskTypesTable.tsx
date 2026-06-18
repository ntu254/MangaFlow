import { useState } from 'react'
import { Edit, PenTool, Power, Trash2 } from 'lucide-react'
import { useDeleteAdminTaskType, useUpdateAdminTaskTypeStatus } from '@/features/chapters/hooks/useAdminTaskTypes'
import type { AdminTaskType } from '@/features/chapters/services/task-types.api'
import { AdminActionsMenu } from '@/features/dashboard/components/admin/AdminActionsMenu'
import { EditTaskTypeDialog } from './EditTaskTypeDialog'
import { DataTable, type DataTableColumn } from '@/shared/components/ui/data-table'

interface TaskTypesTableProps {
  taskTypes: AdminTaskType[]
  isLoading: boolean
  isError: boolean
}

export function TaskTypesTable({ taskTypes, isLoading, isError }: TaskTypesTableProps) {
  const updateStatus = useUpdateAdminTaskTypeStatus()
  const deleteTaskType = useDeleteAdminTaskType()
  const [editingTaskType, setEditingTaskType] = useState<AdminTaskType | null>(null)

  const columns: DataTableColumn<AdminTaskType>[] = [
    {
      header: 'Task Type',
      className: 'w-[20%]',
      cell: (task) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <PenTool size={16} />
          </div>
          <span className="font-semibold text-gray-900">{task.name}</span>
        </div>
      ),
    },
    {
      header: 'Description',
      className: 'w-[35%]',
      cell: (task) => (
        <span className="text-xs text-gray-500 leading-relaxed pr-8 line-clamp-2">
          {task.description}
        </span>
      ),
    },
    {
      header: 'Default Base Rate',
      className: 'w-[15%]',
      cell: (task) => (
        <span className="font-medium text-gray-900">
          {task.baseRate.toLocaleString()} VND
        </span>
      ),
    },
    {
      header: 'Status',
      className: 'w-[10%]',
      cell: (task) => (
        <div className={`flex items-center gap-1.5 font-medium text-[11px] ${task.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
          {task.isActive ? 'Active' : 'Inactive'}
        </div>
      ),
    },
    {
      header: 'Last Updated',
      className: 'w-[15%]',
      cell: (task) => (
        <div className="flex flex-col">
          <span className="text-gray-900 text-[11px]">{new Date(task.updatedAt).toLocaleDateString()}</span>
          <span className="text-gray-400 text-[10px]">{new Date(task.updatedAt).toLocaleTimeString()}</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right w-[5%]',
      cell: (task) => (
        <AdminActionsMenu
          disabled={updateStatus.isPending || deleteTaskType.isPending}
          items={[
            {
              label: 'Edit',
              icon: <Edit size={14} />,
              onSelect: () => setEditingTaskType(task),
            },
            {
              label: task.isActive ? 'Deactivate' : 'Activate',
              icon: <Power size={14} />,
              onSelect: () => updateStatus.mutate({ taskTypeId: task.id, isActive: !task.isActive }),
            },
            {
              label: 'Delete',
              icon: <Trash2 size={14} />,
              destructive: true,
              separatorBefore: true,
              onSelect: () => deleteTaskType.mutate(task.id),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          data={taskTypes}
          columns={columns}
          loading={isLoading}
          error={isError}
          rowKey={(t) => t.id}
          className="border-0 rounded-none bg-transparent"
        />
      </div>

      <EditTaskTypeDialog
        taskType={editingTaskType}
        open={Boolean(editingTaskType)}
        onOpenChange={(open) => {
          if (!open) setEditingTaskType(null)
        }}
      />
    </>
  )
}
