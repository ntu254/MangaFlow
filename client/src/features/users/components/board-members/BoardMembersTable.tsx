import { Crown, Power } from 'lucide-react'
import { useUpdateAdminBoardMemberStatus, useSetAdminBoardChair } from '@/features/users/hooks/useAdminUsers'
import type { AdminBoardMember } from '@/features/users/services/admin.api'
import { AdminActionsMenu } from '@/features/dashboard/components/admin/AdminActionsMenu'
import { DataTable, type DataTableColumn } from '@/shared/components/ui/data-table'

const getStatusColor = (status: boolean) => {
  return status ? 'text-emerald-600' : 'text-rose-500'
}

interface BoardMembersTableProps {
  members: AdminBoardMember[]
  isLoading: boolean
  isError: boolean
}

export function BoardMembersTable({ members, isLoading, isError }: BoardMembersTableProps) {
  const updateStatus = useUpdateAdminBoardMemberStatus()
  const setChair = useSetAdminBoardChair()

  const columns: DataTableColumn<AdminBoardMember>[] = [
    {
      header: 'Member',
      className: 'w-[30%]',
      cell: (member) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-xs shrink-0">
            {member.name?.charAt(0).toUpperCase() || 'B'}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 leading-tight">{member.name}</span>
            <span className="text-[10px] text-gray-400">{member.email}</span>
          </div>
        </div>
      ),
    },
    { 
      header: 'Role', 
      className: 'w-[15%]',
      accessorKey: 'role' 
    },
    {
      header: 'User Status',
      className: 'w-[15%]',
      cell: (member) => (
        <span className={`text-xs font-medium ${getStatusColor(member.isUserActive)}`}>
          {member.isUserActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Board Status',
      className: 'w-[10%]',
      cell: (member) => (
        <span className={`text-xs font-medium ${getStatusColor(member.isActive)}`}>
          {member.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Chair',
      className: 'w-[10%]',
      cell: (member) => member.isChair ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
          <Crown size={10} /> Chair
        </span>
      ) : <span className="text-gray-300">-</span>,
    },
    {
      header: 'Joined Date',
      className: 'w-[15%]',
      cell: (member) => new Date(member.createdAt).toLocaleDateString(),
    },
    {
      header: '',
      className: 'text-right w-[5%]',
      cell: (member) => (
        <AdminActionsMenu
          disabled={updateStatus.isPending || setChair.isPending}
          items={[
            {
              label: member.isActive ? 'Deactivate' : 'Activate',
              icon: <Power size={14} />,
              onSelect: () => updateStatus.mutate({ userId: member.userId, isActive: !member.isActive }),
            },
            ...(!member.isChair && member.isActive
              ? [{
                label: 'Set Chair',
                icon: <Crown size={14} />,
                onSelect: () => setChair.mutate(member.userId),
              }]
              : []),
          ]}
        />
      ),
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable
        data={members}
        columns={columns}
        loading={isLoading}
        error={isError}
        rowKey={(m) => m.userId}
        className="border-0 rounded-none bg-transparent"
      />
    </div>
  )
}
