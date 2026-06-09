import { MFTable } from "@/shared/components/ui"
import type { AdminUser, AdminUserRole } from "../api/admin.api"
import { adminUserColumns } from "../utils/admin-users.mappers"

interface AdminUsersTableProps {
  users: AdminUser[]
  loading: boolean
  updatingUserId: string
  onRoleChange: (userId: string, role: AdminUserRole) => void
  onStatusChange: (user: AdminUser) => void
}

export function AdminUsersTable({ users, loading, updatingUserId, onRoleChange, onStatusChange }: AdminUsersTableProps) {
  return (
    <MFTable
      caption="Admin users"
      rows={users}
      columns={adminUserColumns({ updatingUserId, onRoleChange, onStatusChange })}
      getRowKey={(user) => user.id}
      loading={loading}
      emptyTitle="No users found"
      emptyDescription="Admin-created users will appear here after the backend returns records."
    />
  )
}
