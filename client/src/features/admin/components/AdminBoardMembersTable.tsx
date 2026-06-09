import { MFButton, MFBadge, MFTable, type MFTableColumn } from "@/shared/components/ui"
import type { AdminBoardMember } from "../api/admin.api"

interface AdminBoardMembersTableProps {
  members: AdminBoardMember[]
  loading: boolean
  updatingUserId: string
  onStatusChange: (member: AdminBoardMember) => void
  onAssignChair: (member: AdminBoardMember) => void
}

export function AdminBoardMembersTable({ members, loading, updatingUserId, onStatusChange, onAssignChair }: AdminBoardMembersTableProps) {
  const columns = useAdminBoardMemberColumns({ updatingUserId, onStatusChange, onAssignChair })

  return (
    <MFTable
      caption="Board members"
      rows={members}
      columns={columns}
      getRowKey={(member) => member.userId}
      loading={loading}
      emptyTitle="No board members found"
      emptyDescription="Add existing BOARD users here; the backend enforces active BOARD membership and single-chair rules."
    />
  )
}

interface AdminBoardMemberColumnsInput {
  updatingUserId: string
  onStatusChange: (member: AdminBoardMember) => void
  onAssignChair: (member: AdminBoardMember) => void
}

function useAdminBoardMemberColumns({ updatingUserId, onStatusChange, onAssignChair }: AdminBoardMemberColumnsInput): MFTableColumn<AdminBoardMember>[] {
  return [
    {
      id: "member",
      header: "Member",
      cell: (member) => (
        <div>
          <p className="break-words text-label-md text-on-surface">{member.name ?? "Unnamed user"}</p>
          <p className="mt-xs break-all text-label-sm text-on-surface-muted">{member.email ?? member.userId}</p>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: (member) => <MFBadge tone="neutral" size="md">{member.role ?? "BOARD"}</MFBadge>,
    },
    {
      id: "status",
      header: "Status",
      cell: (member) => (
        <div className="flex flex-col gap-xs">
          <MFBadge tone={member.isActive && member.isUserActive ? "success" : "danger"} size="md">
            {member.isActive && member.isUserActive ? "Active" : "Inactive"}
          </MFBadge>
          {!member.isUserActive ? <span className="text-label-sm text-on-surface-muted">User account inactive</span> : null}
        </div>
      ),
    },
    {
      id: "chair",
      header: "Chair",
      cell: (member) => <MFBadge tone={member.isChair ? "warning" : "neutral"} size="md">{member.isChair ? "Chair" : "Member"}</MFBadge>,
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: (member) => (
        <div className="flex flex-wrap justify-end gap-sm">
          <MFButton
            type="button"
            variant="outline"
            size="sm"
            loading={updatingUserId === member.userId}
            disabled={!member.isActive || !member.isUserActive || member.isChair}
            onClick={() => onAssignChair(member)}
          >
            Make chair
          </MFButton>
          <MFButton
            type="button"
            variant="outline"
            size="sm"
            loading={updatingUserId === member.userId}
            onClick={() => onStatusChange(member)}
          >
            {member.isActive ? "Deactivate" : "Activate"}
          </MFButton>
        </div>
      ),
    },
  ]
}
