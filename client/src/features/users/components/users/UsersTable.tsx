import { useState } from 'react'
import { Edit, Power, Trash2 } from 'lucide-react'
import { useDeleteAdminUser, useUpdateAdminUserStatus } from '@/features/users/hooks/useAdminUsers'
import type { AdminUser } from '@/features/users/services/admin.api'
import { AdminActionsMenu } from '@/features/dashboard/components/admin/AdminActionsMenu'
import { EditUserDialog } from './EditUserDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'

const getRoleColor = (role: string) => {
  switch (role) {
    case 'MANGAKA': return 'text-purple-600'
    case 'EDITOR': return 'text-blue-600'
    case 'ASSISTANT': return 'text-teal-600'
    case 'BOARD': return 'text-orange-500'
    case 'ADMIN': return 'text-pink-600'
    default: return 'text-gray-600'
  }
}

const getStatusColor = (isActive: boolean) => {
  return isActive ? 'text-emerald-600' : 'text-orange-500'
}

interface UsersTableProps {
  users: AdminUser[]
  isLoading: boolean
  isError: boolean
}

export function UsersTable({ users, isLoading, isError }: UsersTableProps) {
  const updateStatus = useUpdateAdminUserStatus()
  const deleteUser = useDeleteAdminUser()
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading users...</div>
  if (isError) return <div className="p-6 text-center text-red-500">Failed to load users</div>

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <th className="px-6 py-4 font-semibold w-[20%]">USER</th>
            <th className="px-6 py-4 font-semibold w-[18%]">EMAIL</th>
            <th className="px-6 py-4 font-semibold w-[12%]">TEAM</th>
            <th className="px-6 py-4 font-semibold w-[10%]">ROLE</th>
            <th className="px-6 py-4 font-semibold w-[10%]">STATUS</th>
            <th className="px-6 py-4 font-semibold w-[10%]">CREATED</th>
            <th className="px-6 py-4 font-semibold w-[10%]">LAST UPDATED</th>
            <th className="px-6 py-4 font-semibold w-[5%] text-center">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {users.length === 0 && (
            <tr>
              <td colSpan={8} className="px-6 py-8 text-center text-gray-400 text-sm">
                No users found
              </td>
            </tr>
          )}
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-xs shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{user.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-500">{user.email}</td>
              <td className="px-6 py-4 text-gray-600 text-xs font-medium">{user.team || '-'}</td>
              <td className="px-6 py-4">
                <div className={`flex items-center gap-1.5 font-medium ${getRoleColor(user.role)}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                  {user.role}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className={`flex items-center gap-1.5 font-medium ${getStatusColor(user.isActive)}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                  {user.isActive ? 'Active' : 'Suspended'}
                </div>
              </td>
              <td className="px-6 py-4 text-gray-600 text-xs">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-gray-600 text-xs">
                {new Date(user.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-center">
                <AdminActionsMenu
                  disabled={updateStatus.isPending || deleteUser.isPending}
                  items={[
                    {
                      label: 'Edit',
                      icon: <Edit size={14} />,
                      onSelect: () => setEditingUser(user),
                    },
                    {
                      label: user.isActive ? 'Deactivate' : 'Activate',
                      icon: <Power size={14} />,
                      onSelect: () => updateStatus.mutate({ userId: user.id, isActive: !user.isActive }),
                    },
                    {
                      label: 'Delete',
                      icon: <Trash2 size={14} />,
                      destructive: true,
                      separatorBefore: true,
                      onSelect: () => setDeletingUser(user),
                    },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      <EditUserDialog
        user={editingUser}
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null)
        }}
      />

      <AlertDialog open={Boolean(deletingUser)} onOpenChange={(open) => {
        if (!open) setDeletingUser(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deletingUser?.name ?? 'this user'} from User Management. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteUser.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(event) => {
                event.preventDefault()
                if (!deletingUser) return
                deleteUser.mutate(deletingUser.id, {
                  onSuccess: () => setDeletingUser(null),
                })
              }}
            >
              {deleteUser.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


