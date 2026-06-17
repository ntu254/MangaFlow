import { useState } from 'react'
import { Edit, Power, Trash2 } from 'lucide-react'
import { useDeleteAdminUser, useUpdateAdminUserStatus } from '@/features/users/hooks/useAdminUsers'
import type { AdminUser } from '@/features/users/services/admin.api'
import { AdminActionsMenu } from '@/features/dashboard/components/admin/AdminActionsMenu'
import { EditUserDialog } from './EditUserDialog'
import { DataTable, type DataTableColumn } from '@/shared/components/ui/data-table'
import { UserRoleBadge } from '@/features/admin/components/UserRoleBadge'
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

const getStatusColor = (isActive: boolean) => {
  return isActive ? 'text-emerald-600 bg-emerald-500/10' : 'text-amber-600 bg-amber-500/10'
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

  const columns: DataTableColumn<AdminUser>[] = [
    {
      header: 'USER',
      className: 'w-[25%]',
      cell: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-xs shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
             <span className="font-medium text-foreground">{user.name}</span>
             <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'TEAM',
      className: 'w-[15%]',
      cell: (user) => <span className="text-xs font-medium text-muted-foreground">{user.team || '-'}</span>,
    },
    {
      header: 'ROLE',
      className: 'w-[15%]',
      cell: (user) => <UserRoleBadge role={user.role} />,
    },
    {
      header: 'STATUS',
      className: 'w-[15%]',
      cell: (user) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActive)}`}>
          {user.isActive ? 'Active' : 'Suspended'}
        </span>
      ),
    },
    {
      header: 'LAST UPDATED',
      className: 'w-[15%]',
      cell: (user) => (
        <span className="text-xs text-muted-foreground">
          {new Date(user.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'ACTIONS',
      className: 'text-right w-[15%]',
      cell: (user) => (
        <div className="flex justify-end">
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
        </div>
      ),
    },
  ]

  if (isError) return <div className="p-6 text-center text-red-500">Failed to load users</div>

  return (
    <>
      <DataTable
        data={users}
        columns={columns}
        loading={isLoading}
        rowKey={(user) => user.id}
        className="border-0 rounded-none bg-transparent"
      />

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
