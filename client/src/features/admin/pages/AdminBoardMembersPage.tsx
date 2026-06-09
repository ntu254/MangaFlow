import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFButton, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { AdminBoardMembersDialog } from "../components/AdminBoardMembersDialog"
import { AdminBoardMembersTable } from "../components/AdminBoardMembersTable"
import { useAdminBoardMembers } from "../hooks/useAdminBoardMembers"

export function AdminBoardMembersPage() {
  const boardMembers = useAdminBoardMembers()

  usePageTitle(
    "Board Members",
    "Manage Board membership and Chair assignment. Admin manages access only; Board decisions remain Board-owned.",
  )

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-sm">
              <MFBadge tone="primary" size="md">Admin only</MFBadge>
              <MFBadge tone="success" size="md">Backend enforced</MFBadge>
            </div>
            <h1 className="mt-md text-headline-lg text-on-surface">Board Members</h1>
            <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
              Admin manages Board membership and Chair assignment only. Board approval, votes, and final decisions remain outside Admin authority.
            </p>
          </div>
          <MFButton type="button" onClick={() => boardMembers.setDialogOpen(true)}>Add member</MFButton>
        </div>
      </MFCard>

      <section className="grid gap-lg md:grid-cols-3">
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Total members</p>
          <p className="mt-sm text-headline-md text-on-surface">{boardMembers.members.length}</p>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Active</p>
          <p className="mt-sm text-headline-md text-on-surface">{boardMembers.activeCount}</p>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Chair</p>
          <p className="mt-sm text-headline-md text-on-surface">{boardMembers.chair?.name ?? boardMembers.chair?.email ?? "Unassigned"}</p>
        </MFCard>
      </section>

      {boardMembers.error ? <MFErrorState title="Could not load board members" description={boardMembers.error} onRetry={() => void boardMembers.loadMembers()} /> : null}
      {boardMembers.message ? <MFBadge tone="neutral" size="md">{boardMembers.message}</MFBadge> : null}

      <AdminBoardMembersTable
        members={boardMembers.members}
        loading={boardMembers.loading}
        updatingUserId={boardMembers.updatingUserId}
        onStatusChange={(member) => void boardMembers.handleStatusChange(member)}
        onAssignChair={(member) => void boardMembers.handleAssignChair(member)}
      />

      <AdminBoardMembersDialog
        open={boardMembers.dialogOpen}
        submitting={boardMembers.submitting}
        members={boardMembers.members}
        onAddMember={boardMembers.handleCreateMember}
        onClose={() => boardMembers.setDialogOpen(false)}
      />
    </PageShell>
  )
}
