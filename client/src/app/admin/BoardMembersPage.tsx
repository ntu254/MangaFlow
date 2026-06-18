import { useMemo, useState, type ReactNode } from 'react'
import { Crown, Filter, Power, ShieldCheck, Users } from 'lucide-react'
import { AddBoardMemberDialog } from '@/features/users/components/board-members/AddBoardMemberDialog'
import {
  useAdminBoardMembers,
  useSetAdminBoardChair,
  useUpdateAdminBoardMemberStatus,
} from '@/features/users/hooks/useAdminUsers'
import type { AdminBoardMember } from '@/features/users/services/admin.api'
import { usePageChrome } from '@/shared/components/layout/page-chrome'
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

type BoardStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'CHAIR'
type SortMode = 'UPDATED_DESC' | 'JOINED_DESC' | 'NAME_ASC'

const STATUS_FILTERS: Array<{ value: BoardStatusFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'CHAIR', label: 'Chair' },
]

const SORT_LABELS: Record<SortMode, string> = {
  UPDATED_DESC: 'Recently updated',
  JOINED_DESC: 'Newest joined',
  NAME_ASC: 'Name A-Z',
}

const fmtDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '-')
const fmtDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : '-')

function initials(member: AdminBoardMember) {
  return member.name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function BoardMembersPage() {
  const { data: members = [], isLoading, isError } = useAdminBoardMembers()
  const updateStatus = useUpdateAdminBoardMemberStatus()
  const setChair = useSetAdminBoardChair()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BoardStatusFilter>('ALL')
  const [sort, setSort] = useState<SortMode>('UPDATED_DESC')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  usePageChrome(
    {
      contextHeader: {
        title: 'Board members',
        breadcrumb: 'Admin · Governance',
        status: (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
            {members.length}
          </span>
        ),
      },
    },
    [members.length],
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return members
      .filter((member) => {
        if (statusFilter === 'ACTIVE' && !member.isActive) return false
        if (statusFilter === 'INACTIVE' && member.isActive) return false
        if (statusFilter === 'CHAIR' && !member.isChair) return false
        if (!q) return true
        return [member.name, member.email, member.role]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(q))
      })
      .sort((a, b) => {
        if (sort === 'NAME_ASC') return a.name.localeCompare(b.name)
        if (sort === 'JOINED_DESC') return Date.parse(b.createdAt) - Date.parse(a.createdAt)
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
      })
  }, [members, search, statusFilter, sort])

  const selected = useMemo(
    () => members.find((member) => member.userId === selectedId) ?? null,
    [members, selectedId],
  )

  const isMutating = updateStatus.isPending || setChair.isPending

  const toggleStatus = (member: AdminBoardMember) => {
    updateStatus.mutate({ userId: member.userId, isActive: !member.isActive })
  }

  const assignChair = (member: AdminBoardMember) => {
    if (member.isChair || !member.isActive) return
    setChair.mutate(member.userId)
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <CommandBar
        searchPlaceholder="Search by name, email, or role..."
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
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as BoardStatusFilter)}
            >
              <SelectTrigger className="h-9 w-full bg-secondary/50 xl:hidden sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
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
        actions={<AddBoardMemberDialog />}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>User status</TableHead>
              <TableHead>Board status</TableHead>
              <TableHead>Chair</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  Loading board members...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-destructive">
                  Failed to load board members.
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                  <Users className="mx-auto mb-3 text-muted-foreground/50" size={36} strokeWidth={1.5} />
                  No board members match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((member) => (
                <TableRow
                  key={member.userId}
                  data-state={selectedId === member.userId ? 'selected' : undefined}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(member.userId)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <AvatarMark member={member} />
                      <div className="min-w-0">
                        <div className="line-clamp-1 text-sm font-semibold text-foreground">{member.name}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RolePill role={member.role} />
                  </TableCell>
                  <TableCell>
                    <StatusPill isActive={member.isUserActive} activeLabel="Active" inactiveLabel="Suspended" />
                  </TableCell>
                  <TableCell>
                    <StatusPill isActive={member.isActive} activeLabel="Active" inactiveLabel="Inactive" />
                  </TableCell>
                  <TableCell>
                    <ChairPill isChair={member.isChair} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(member.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={member.isActive ? 'Deactivate board member' : 'Activate board member'}
                        disabled={isMutating}
                        onClick={() => toggleStatus(member)}
                      >
                        <Power size={15} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={member.isChair ? 'Current chair' : 'Set as chair'}
                        disabled={isMutating || member.isChair || !member.isActive}
                        onClick={() => assignChair(member)}
                      >
                        <Crown size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <BoardMemberDrawer
        member={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        isMutating={isMutating}
        onToggleStatus={toggleStatus}
        onSetChair={assignChair}
      />
    </div>
  )
}

function BoardMemberDrawer({
  member,
  open,
  onOpenChange,
  isMutating,
  onToggleStatus,
  onSetChair,
}: {
  member: AdminBoardMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isMutating: boolean
  onToggleStatus: (member: AdminBoardMember) => void
  onSetChair: (member: AdminBoardMember) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {member && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <AvatarMark member={member} size="lg" />
                <div className="min-w-0">
                  <SheetTitle>{member.name}</SheetTitle>
                  <SheetDescription>{member.email}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-5 text-sm">
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Governance</span>
                  <div className="flex items-center gap-2">
                    <RolePill role={member.role} />
                    <ChairPill isChair={member.isChair} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                  <Field label="User account" value={member.isUserActive ? 'Active' : 'Suspended'} />
                  <Field label="Board access" value={member.isActive ? 'Active' : 'Inactive'} />
                  <Field label="Joined" value={fmtDate(member.createdAt)} />
                  <Field label="Updated" value={fmtDate(member.updatedAt)} />
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Access state</h3>
                <div className="rounded-lg border border-border p-3">
                  <Row
                    label="User account"
                    value={<StatusPill isActive={member.isUserActive} activeLabel="Active" inactiveLabel="Suspended" />}
                  />
                  <Row
                    label="Board member"
                    value={<StatusPill isActive={member.isActive} activeLabel="Active" inactiveLabel="Inactive" />}
                  />
                  <Row label="Chair role" value={<ChairPill isChair={member.isChair} />} />
                </div>
              </section>

              {!member.isUserActive && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                  Reactivate the user account before assigning new board duties.
                </p>
              )}

              <section className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeline</h3>
                <Row label="Joined" value={fmtDateTime(member.createdAt)} />
                <Row label="Updated" value={fmtDateTime(member.updatedAt)} />
              </section>

              <details className="rounded-lg border border-border bg-secondary/30 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Reference ids</summary>
                <div className="mt-2 space-y-1 break-all font-mono text-[11px] text-muted-foreground">
                  <div>user: {member.userId}</div>
                  <div>role: {member.role}</div>
                </div>
              </details>
            </div>

            <SheetFooter className="mt-8 gap-2 sm:space-x-0">
              <Button type="button" variant="secondary" disabled={isMutating} onClick={() => onToggleStatus(member)}>
                <Power size={15} /> {member.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                type="button"
                disabled={isMutating || member.isChair || !member.isActive}
                onClick={() => onSetChair(member)}
              >
                <Crown size={15} /> {member.isChair ? 'Current chair' : 'Set chair'}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function AvatarMark({ member, size = 'md' }: { member: AdminBoardMember; size?: 'md' | 'lg' }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary',
        size === 'lg' ? 'h-12 w-12 text-sm' : 'h-9 w-9 text-xs',
      )}
    >
      {initials(member)}
    </div>
  )
}

function RolePill({ role }: { role: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-md border border-amber-200 bg-amber-50 px-2 text-xs font-semibold text-amber-700">
      <ShieldCheck size={12} className="mr-1" />
      {role}
    </span>
  )
}

function StatusPill({
  isActive,
  activeLabel,
  inactiveLabel,
}: {
  isActive: boolean
  activeLabel: string
  inactiveLabel: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-md border px-2 text-xs font-semibold',
        isActive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-rose-200 bg-rose-50 text-rose-700',
      )}
    >
      {isActive ? activeLabel : inactiveLabel}
    </span>
  )
}

function ChairPill({ isChair }: { isChair: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-md border px-2 text-xs font-semibold',
        isChair
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-border bg-secondary text-muted-foreground',
      )}
    >
      <Crown size={12} className="mr-1" />
      {isChair ? 'Chair' : 'Member'}
    </span>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
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
