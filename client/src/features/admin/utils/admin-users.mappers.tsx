import { MFBadge, MFButton, MFSelect, type MFTableColumn } from "@/shared/components/ui"
import type { AdminUser, AdminUserRole } from "../api/admin.api"

export const ADMIN_USER_ROLES: AdminUserRole[] = ["MANGAKA", "ASSISTANT", "EDITOR", "BOARD", "ADMIN"]

interface AdminUserColumnsInput {
  updatingUserId: string
  onRoleChange: (userId: string, role: AdminUserRole) => void
  onStatusChange: (user: AdminUser) => void
}

export function adminUserColumns({ updatingUserId, onRoleChange, onStatusChange }: AdminUserColumnsInput): MFTableColumn<AdminUser>[] {
  return [
    {
      id: "user",
      header: "User",
      cell: (user) => <div><p className="break-words text-label-md text-on-surface">{user.name}</p><p className="mt-xs break-all text-label-sm text-on-surface-muted">{user.email}</p></div>,
    },
    {
      id: "role",
      header: "Role",
      cell: (user) => (
        <MFSelect label="Role" value={user.role} disabled={updatingUserId === user.id} onChange={(event) => onRoleChange(user.id, event.target.value as AdminUserRole)}>
          {ADMIN_USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
        </MFSelect>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (user) => <MFBadge tone={user.isActive ? "success" : "danger"} size="md">{user.isActive ? "Active" : "Suspended"}</MFBadge>,
    },
    {
      id: "updated",
      header: "Updated",
      cell: (user) => user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "Not supplied",
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: (user) => <MFButton type="button" variant="outline" size="sm" loading={updatingUserId === user.id} onClick={() => onStatusChange(user)}>{user.isActive ? "Suspend" : "Activate"}</MFButton>,
    },
  ]
}
