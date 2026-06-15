import { Crown, Power } from 'lucide-react'
import { useUpdateAdminBoardMemberStatus, useSetAdminBoardChair } from '@/hooks/useAdmin'
import type { AdminBoardMember } from '@/api/admin'
import { AdminActionsMenu } from '@/features/admin/components/common/AdminActionsMenu'

const getStatusColor = (status: boolean) => {
  return status ? 'text-emerald-600' : 'text-red-500'
}

interface BoardMembersTableProps {
  members: AdminBoardMember[]
  isLoading: boolean
  isError: boolean
}

export function BoardMembersTable({ members, isLoading, isError }: BoardMembersTableProps) {
  const updateStatus = useUpdateAdminBoardMemberStatus()
  const setChair = useSetAdminBoardChair()

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading board members...</div>
  if (isError) return <div className="p-6 text-center text-red-500">Failed to load board members</div>

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <th className="px-6 py-4 font-semibold w-[30%]">Member</th>
            <th className="px-6 py-4 font-semibold w-[15%]">Role</th>
            <th className="px-6 py-4 font-semibold w-[15%]">User Status</th>
            <th className="px-6 py-4 font-semibold w-[10%]">Board Status</th>
            <th className="px-6 py-4 font-semibold w-[10%]">Chair</th>
            <th className="px-6 py-4 font-semibold w-[15%]">Joined Date</th>
            <th className="px-6 py-4 font-semibold w-[5%]"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {members.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm">
                No board members found
              </td>
            </tr>
          )}
          {members.map((member) => (
            <tr key={member.userId} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-xs shrink-0">
                    {member.name?.charAt(0).toUpperCase() || 'B'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 leading-tight">{member.name}</span>
                    <span className="text-[10px] text-gray-400">{member.email}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-700 font-medium">{member.role}</td>
              <td className="px-6 py-4">
                <span className={`text-xs font-medium ${getStatusColor(member.isUserActive)}`}>
                  {member.isUserActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`text-xs font-medium ${getStatusColor(member.isActive)}`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4">
                {member.isChair ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                    <Crown size={10} /> Chair
                  </span>
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-gray-600 text-xs">
                {new Date(member.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


