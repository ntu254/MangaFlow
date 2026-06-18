import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Edit3, Filter, Power, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react'
import { EditUserDialog } from '@/features/users/components/users/EditUserDialog'
import {
  useAdminUsers,
  useDeleteAdminUser,
  useUpdateAdminUserStatus,
} from '@/features/users/hooks/useAdminUsers'
import type { AdminUser } from '@/features/users/services/admin.api'
import { usePageChrome } from '@/shared/components/layout/page-chrome'
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
import { Button } from '@/shared/components/ui/button'
import { CommandBar } from '@/shared/components/ui/command-bar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { cn } from '@/shared/lib/utils'

const USER_ROLES = ['ADMIN', 'MANGAKA', 'ASSISTANT', 'EDITOR', 'BOARD'] as const
type UserRole = (typeof USER_ROLES)[number]
type RoleFilter = 'ALL' | UserRole
type StatusFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED'
type SortMode = 'UPDATED_DESC' | 'CREATED_DESC' | 'NAME_ASC'

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

const SORT_LABELS: Record<SortMode, string> = {
  UPDATED_DESC: 'Recently updated',
  CREATED_DESC: 'Newest created',
  NAME_ASC: 'Name A-Z',
}

const fmtDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '-')
const fmtDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : '-')

function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole)
}

function initials(user: AdminUser) {
  const label = user.displayName || user.name || user.email
  return label
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function UsersPage() {
  const { data: users = [], isLoading, isError } = useAdminUsers()
  const updateStatus = useUpdateAdminUserStatus()
  const deleteUser = useDeleteAdminUser()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [sort, setSort] = useState<SortMode>('UPDATED_DESC')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)

  usePageChrome(
    {
      contextHeader: {
        title: 'Users',
        breadcrumb: 'Admin · Access',
        status: (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
            {users.length}
          </span>
        ),
      },
    },
    [users.length],
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users
      .filter((user) => {
        if (roleFilter !== 'ALL' && user.role !== roleFilter) return false
        if (statusFilter !== 'ALL' && user.isActive !== (statusFilter === 'ACTIVE')) return false
        if (!q) return true
        return [user.name, user.displayName, user.email, user.team, user.role]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(q))
      })
      .sort((a, b) => {
        if (sort === 'NAME_ASC') return a.name.localeCompare(b.name)
        if (sort === 'CREATED_DESC') return Date.parse(b.createdAt) - Date.parse(a.createdAt)
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
      })
  }, [users, search, roleFilter, statusFilter, sort])

  const selected = useMemo(
    () => users.find((user) => user.id === selectedId) ?? null,
    [users, selectedId],
  )

  const isMutating = updateStatus.isPending || deleteUser.isPending

  const toggleStatus = (user: AdminUser) => {
    updateStatus.mutate({ userId: user.id, isActive: !user.isActive })
  }

  const requestDelete = (user: AdminUser) => setDeletingUser(user)

  const confirmDelete = () => {
    if (!deletingUser) return
    deleteUser.mutate(deletingUser.id, {
      onSuccess: () => {
        if (selectedId === deletingUser.id) setSelectedId(null)
        setDeletingUser(null)
      },
    })
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <CommandBar
        searchPlaceholder="Search by name, email, team, or role..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="hidden items-center gap-1 xl:flex">
              <Filter size={15} className="mr-1 text-muted-foreground" />
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors',
                    statusFilter === filter.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary',
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
              <SelectTrigger className="h-9 w-full bg-secondary/50 sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as SortMode)}>
              <SelectTrigger className="h-9 w-full bg-secondary/50 sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        actions={
          <Button asChild className="h-10 gap-2">
            <Link to="/app/admin/users/create">
              <UserPlus size={16} /> Create user
            </Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-destructive">
                  Failed to load users.
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                  <Users className="mx-auto mb-3 text-muted-foreground/50" size={36} strokeWidth={1.5} />
                  No users match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((user) => (
                <TableRow
                  key={user.id}
                  data-state={selectedId === user.id ? 'selected' : undefined}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(user.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <AvatarMark user={user} />
                      <div className="min-w-0">
                        <div className="line-clamp-1 text-sm font-semibold text-foreground">
                          {user.displayName || user.name}
                        </div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.team || '-'}</TableCell>
                  <TableCell>
                    <RolePill role={user.role} />
                  </TableCell>
                  <TableCell>
                    <StatusPill isActive={user.isActive} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(user.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit user"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit3 size={15} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={user.isActive ? 'Suspend user' : 'Activate user'}
                        disabled={isMutating}
                        onClick={() => toggleStatus(user)}
                      >
                        <Power size={15} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete user"
                        disabled={isMutating}
                        onClick={() => requestDelete(user)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserDrawer
        user={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        isMutating={isMutating}
        onEdit={(user) => setEditingUser(user)}
        onToggleStatus={toggleStatus}
        onDelete={requestDelete}
      />

      <EditUserDialog
        user={editingUser}
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null)
        }}
      />

      <AlertDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => {
          if (!open && !deleteUser.isPending) setDeletingUser(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deletingUser?.displayName || deletingUser?.name || 'this user'} from admin user management.
              The action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault()
                confirmDelete()
              }}
            >
              {deleteUser.isPending ? 'Deleting...' : 'Delete user'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function UserDrawer({
  user,
  open,
  onOpenChange,
  isMutating,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isMutating: boolean
  onEdit: (user: AdminUser) => void
  onToggleStatus: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {user && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <AvatarMark user={user} size="lg" />
                <div className="min-w-0">
                  <SheetTitle>{user.displayName || user.name}</SheetTitle>
                  <SheetDescription>{user.email}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-5 text-sm">
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Access</span>
                  <div className="flex items-center gap-2">
                    <RolePill role={user.role} />
                    <StatusPill isActive={user.isActive} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                  <Field label="Name" value={user.name} />
                  <Field label="Team" value={user.team || '-'} />
                  <Field label="Created" value={fmtDate(user.createdAt)} />
                  <Field label="Updated" value={fmtDate(user.updatedAt)} />
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact</h3>
                <div className="rounded-lg border border-border p-3">
                  <Row label="Email" value={<span className="break-all">{user.email}</span>} />
                  <Row label="Display" value={user.displayName || '-'} />
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</h3>
                <p className="rounded-lg border border-border p-3 leading-relaxed text-muted-foreground">
                  {user.notes || 'No internal notes recorded.'}
                </p>
              </section>

              <section className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeline</h3>
                <Row label="Created" value={fmtDateTime(user.createdAt)} />
                <Row label="Updated" value={fmtDateTime(user.updatedAt)} />
              </section>

              <details className="rounded-lg border border-border bg-secondary/30 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Reference ids</summary>
                <div className="mt-2 space-y-1 break-all font-mono text-[11px] text-muted-foreground">
                  <div>user: {user.id}</div>
                  <div>role: {user.role}</div>
                </div>
              </details>
            </div>

            <SheetFooter className="mt-8 gap-2 sm:space-x-0">
              <Button type="button" variant="outline" onClick={() => onEdit(user)}>
                <Edit3 size={15} /> Edit
              </Button>
              <Button type="button" variant="secondary" disabled={isMutating} onClick={() => onToggleStatus(user)}>
                <Power size={15} /> {user.isActive ? 'Suspend' : 'Activate'}
              </Button>
              <Button type="button" variant="destructive" disabled={isMutating} onClick={() => onDelete(user)}>
                <Trash2 size={15} /> Delete
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function AvatarMark({ user, size = 'md' }: { user: AdminUser; size?: 'md' | 'lg' }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary',
        size === 'lg' ? 'h-12 w-12 text-sm' : 'h-9 w-9 text-xs',
      )}
    >
      {initials(user)}
    </div>
  )
}

function RolePill({ role }: { role: string }) {
  const normalized = isUserRole(role) ? role : undefined
  const className = normalized
    ? {
        ADMIN: 'border-border bg-secondary text-secondary-foreground',
        BOARD: 'border-amber-200 bg-amber-50 text-amber-700',
        EDITOR: 'border-blue-200 bg-blue-50 text-blue-700',
        MANGAKA: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        ASSISTANT: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
      }[normalized]
    : 'border-border bg-secondary text-secondary-foreground'

  return (
    <span className={cn('inline-flex h-6 items-center rounded-md border px-2 text-xs font-semibold', className)}>
      <ShieldCheck size={12} className="mr-1" />
      {role}
    </span>
  )
}

function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-md border px-2 text-xs font-semibold',
        isActive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-rose-200 bg-rose-50 text-rose-700',
      )}
    >
      {isActive ? 'Active' : 'Suspended'}
    </span>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  )
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  )
}
