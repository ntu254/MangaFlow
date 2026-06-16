import { useState } from 'react'
import { Edit, PenTool, Power, Trash2 } from 'lucide-react'
import { useDeleteAdminTaskType, useUpdateAdminTaskTypeStatus } from '@/features/chapters/hooks/useAdminTaskTypes'
import type { AdminTaskType } from '@/features/chapters/services/task-types.api'
import { AdminActionsMenu } from '@/features/dashboard/components/admin/AdminActionsMenu'
import { EditTaskTypeDialog } from './EditTaskTypeDialog'

interface TaskTypesTableProps {
  taskTypes: AdminTaskType[]
  isLoading: boolean
  isError: boolean
}

export function TaskTypesTable({ taskTypes, isLoading, isError }: TaskTypesTableProps) {
  const updateStatus = useUpdateAdminTaskTypeStatus()
  const deleteTaskType = useDeleteAdminTaskType()
  const [editingTaskType, setEditingTaskType] = useState<AdminTaskType | null>(null)

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading task types...</div>
  if (isError) return <div className="p-6 text-center text-red-500">Failed to load task types</div>

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
            <th className="px-6 py-4 w-[20%]">Task Type</th>
            <th className="px-6 py-4 w-[35%]">Description</th>
            <th className="px-6 py-4 w-[15%]">Default Base Rate</th>
            <th className="px-6 py-4 w-[10%]">Status</th>
            <th className="px-6 py-4 w-[15%]">Last Updated</th>
            <th className="px-6 py-4 w-[5%] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {taskTypes.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">
                No task types found
              </td>
            </tr>
          )}
          {taskTypes.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <PenTool size={16} />
                  </div>
                  <span className="font-semibold text-gray-900">{task.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-xs text-gray-500 leading-relaxed pr-8">
                {task.description}
              </td>
              <td className="px-6 py-4 font-medium text-gray-900">
                {task.baseRate.toLocaleString()} VND
              </td>
              <td className="px-6 py-4">
                <div className={`flex items-center gap-1.5 font-medium text-[11px] ${task.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                  {task.isActive ? 'Active' : 'Inactive'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-gray-900 text-[11px]">{new Date(task.updatedAt).toLocaleDateString()}</span>
                  <span className="text-gray-400 text-[10px]">{new Date(task.updatedAt).toLocaleTimeString()}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
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
              </td>
            </tr>
          ))}
        </tbody>
        </table>
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


