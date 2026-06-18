import { useMemo, useState, type ReactNode } from 'react'
import { Edit3, Filter, Layers, Power, Settings2, Trash2 } from 'lucide-react'
import { CreateTaskTypeDialog } from '@/features/chapters/components/task-types/CreateTaskTypeDialog'
import { EditTaskTypeDialog } from '@/features/chapters/components/task-types/EditTaskTypeDialog'
import {
  useAdminTaskTypes,
  useDeleteAdminTaskType,
  useUpdateAdminTaskTypeStatus,
} from '@/features/chapters/hooks/useAdminTaskTypes'
import { type AdminTaskType, taskTypeId } from '@/features/chapters/services/task-types.api'
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

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'
type SortMode = 'UPDATED_DESC' | 'NAME_ASC' | 'RATE_DESC' | 'RATE_ASC'

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

const SORT_LABELS: Record<SortMode, string> = {
  UPDATED_DESC: 'Recently updated',
  NAME_ASC: 'Name A-Z',
  RATE_DESC: 'Highest rate',
  RATE_ASC: 'Lowest rate',
}

const fmtDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '-')
const fmtDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : '-')
const fmtRate = (value: number, currency: AdminTaskType['currency']) =>
  `${new Intl.NumberFormat('en-US').format(value)} ${currency}`

export default function TaskTypesPage() {
  const { data: taskTypes = [], isLoading, isError } = useAdminTaskTypes()
  const updateStatus = useUpdateAdminTaskTypeStatus()
  const deleteTaskType = useDeleteAdminTaskType()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [sort, setSort] = useState<SortMode>('UPDATED_DESC')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingTaskType, setEditingTaskType] = useState<AdminTaskType | null>(null)

  usePageChrome(
    {
      contextHeader: {
        title: 'Task types',
        breadcrumb: 'Admin · Config',
        status: (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
            {taskTypes.length}
          </span>
        ),
      },
    },
    [taskTypes.length],
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return taskTypes
      .filter((task) => {
        if (statusFilter !== 'ALL' && task.isActive !== (statusFilter === 'ACTIVE')) return false
        if (!q) return true
        return [task.name, task.code, task.description, task.currency]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(q))
      })
      .sort((a, b) => {
        if (sort === 'NAME_ASC') return a.name.localeCompare(b.name)
        if (sort === 'RATE_DESC') return b.baseRate - a.baseRate
        if (sort === 'RATE_ASC') return a.baseRate - b.baseRate
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
      })
  }, [taskTypes, search, statusFilter, sort])

  const selected = useMemo(
    () => taskTypes.find((task) => taskTypeId(task) === selectedId) ?? null,
    [taskTypes, selectedId],
  )

  const isMutating = updateStatus.isPending || deleteTaskType.isPending

  const toggleStatus = (task: AdminTaskType) => {
    updateStatus.mutate({
      taskTypeId: taskTypeId(task),
      isActive: !task.isActive,
    })
  }

  const removeTaskType = (task: AdminTaskType) => {
    deleteTaskType.mutate(taskTypeId(task), {
      onSuccess: () => {
        if (selectedId === taskTypeId(task)) setSelectedId(null)
      },
    })
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <CommandBar
        searchPlaceholder="Search by name, code, or description..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="hidden items-center gap-1 lg:flex">
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
        actions={<CreateTaskTypeDialog />}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Base rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Loading task types...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-destructive">
                  Failed to load task types.
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                  <Layers className="mx-auto mb-3 text-muted-foreground/50" size={36} strokeWidth={1.5} />
                  No task types match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((task) => {
                const id = taskTypeId(task)
                return (
                  <TableRow
                    key={id}
                    data-state={selectedId === id ? 'selected' : undefined}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Settings2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="line-clamp-1 text-sm font-semibold text-foreground">{task.name}</div>
                          <div className="font-mono text-[11px] font-semibold text-muted-foreground">{task.code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[360px]">
                      <span className="line-clamp-2 text-sm text-muted-foreground">
                        {task.description || 'No description provided.'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground tabular-nums">
                      {fmtRate(task.baseRate, task.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusPill isActive={task.isActive} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(task.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit task type"
                          onClick={() => setEditingTaskType(task)}
                        >
                          <Edit3 size={15} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={task.isActive ? 'Deactivate task type' : 'Activate task type'}
                          disabled={isMutating}
                          onClick={() => toggleStatus(task)}
                        >
                          <Power size={15} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete task type"
                          disabled={isMutating}
                          onClick={() => removeTaskType(task)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TaskTypeDrawer
        taskType={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        isMutating={isMutating}
        onEdit={(task) => setEditingTaskType(task)}
        onToggleStatus={toggleStatus}
        onDelete={removeTaskType}
      />

      <EditTaskTypeDialog
        taskType={editingTaskType}
        open={Boolean(editingTaskType)}
        onOpenChange={(open) => {
          if (!open) setEditingTaskType(null)
        }}
        onSaved={(task) => setSelectedId(taskTypeId(task))}
      />
    </div>
  )
}

function TaskTypeDrawer({
  taskType,
  open,
  onOpenChange,
  isMutating,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  taskType: AdminTaskType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isMutating: boolean
  onEdit: (taskType: AdminTaskType) => void
  onToggleStatus: (taskType: AdminTaskType) => void
  onDelete: (taskType: AdminTaskType) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {taskType && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <SheetTitle>{taskType.name}</SheetTitle>
                <StatusPill isActive={taskType.isActive} />
              </div>
              <SheetDescription>
                <span className="font-mono text-xs font-semibold">{taskType.code}</span>
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5 text-sm">
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Base rate</span>
                  <span className="text-xl font-bold text-foreground tabular-nums">
                    {fmtRate(taskType.baseRate, taskType.currency)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                  <Field label="Currency" value={taskType.currency} />
                  <Field label="Sort order" value={taskType.sortOrder ?? 0} />
                  <Field label="Status" value={taskType.isActive ? 'Active' : 'Inactive'} />
                  <Field label="Updated" value={fmtDate(taskType.updatedAt)} />
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</h3>
                <p className="rounded-lg border border-border p-3 leading-relaxed text-muted-foreground">
                  {taskType.description || 'No description provided.'}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capabilities</h3>
                <div className="flex flex-wrap gap-2">
                  <CapabilityChip active={taskType.allowPageTask}>Page task</CapabilityChip>
                  <CapabilityChip active={taskType.allowRegionTask}>Region task</CapabilityChip>
                  <CapabilityChip active={taskType.requiresFileSubmission}>File required</CapabilityChip>
                  <CapabilityChip active={taskType.requiresTextSubmission}>Text required</CapabilityChip>
                </div>
              </section>

              <section className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeline</h3>
                <Row label="Created" value={fmtDateTime(taskType.createdAt)} />
                <Row label="Updated" value={fmtDateTime(taskType.updatedAt)} />
              </section>

              <details className="rounded-lg border border-border bg-secondary/30 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Reference ids</summary>
                <div className="mt-2 space-y-1 break-all font-mono text-[11px] text-muted-foreground">
                  <div>id: {taskTypeId(taskType)}</div>
                  {taskType._id && <div>_id: {taskType._id}</div>}
                  <div>code: {taskType.code}</div>
                </div>
              </details>
            </div>

            <SheetFooter className="mt-8 gap-2 sm:space-x-0">
              <Button type="button" variant="outline" onClick={() => onEdit(taskType)}>
                <Edit3 size={15} /> Edit
              </Button>
              <Button type="button" variant="secondary" disabled={isMutating} onClick={() => onToggleStatus(taskType)}>
                <Power size={15} /> {taskType.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button type="button" variant="destructive" disabled={isMutating} onClick={() => onDelete(taskType)}>
                <Trash2 size={15} /> Delete
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
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
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

function CapabilityChip({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold',
        active
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-border bg-secondary text-muted-foreground',
      )}
    >
      {children}
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
