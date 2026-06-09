import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFButton, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { AdminUserDialog } from "../components/AdminUserDialog"
import { AdminUsersTable } from "../components/AdminUsersTable"
import { useAdminUsers } from "../hooks/useAdminUsers"

export function AdminUsersPage() {
  const users = useAdminUsers()

  usePageTitle("Admin Users", "Create users, update roles, and activate or suspend accounts through backend Admin routes.")

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-sm">
              <MFBadge tone="primary" size="md">Admin only</MFBadge>
              <MFBadge tone="success" size="md">Backend enforced</MFBadge>
            </div>
            <h1 className="mt-md text-headline-lg text-on-surface">Users management</h1>
            <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">Manage system accounts and coarse roles. Admin cannot approve manuscripts, override Board decisions, or bypass backend workflow rules.</p>
          </div>
          <MFButton type="button" onClick={() => users.setDialogOpen(true)}>Create user</MFButton>
        </div>
      </MFCard>

      <section className="grid gap-lg md:grid-cols-3">
        <MFCard><p className="text-label-sm text-on-surface-muted">Total users</p><p className="mt-sm text-headline-md text-on-surface">{users.users.length}</p></MFCard>
        <MFCard><p className="text-label-sm text-on-surface-muted">Active</p><p className="mt-sm text-headline-md text-on-surface">{users.activeCount}</p></MFCard>
        <MFCard><p className="text-label-sm text-on-surface-muted">Suspended</p><p className="mt-sm text-headline-md text-on-surface">{users.suspendedCount}</p></MFCard>
      </section>

      {users.error ? <MFErrorState title="Could not load users" description={users.error} onRetry={() => void users.loadUsers()} /> : null}
      {users.message ? <MFBadge tone="neutral" size="md">{users.message}</MFBadge> : null}

      <AdminUsersTable users={users.users} loading={users.loading} updatingUserId={users.updatingUserId} onRoleChange={(userId, role) => void users.handleRoleChange(userId, role)} onStatusChange={(user) => void users.handleStatusChange(user)} />

      <AdminUserDialog open={users.dialogOpen} submitting={users.submitting} onClose={() => users.setDialogOpen(false)} onSubmit={users.handleCreateUser} />
    </PageShell>
  )
}
