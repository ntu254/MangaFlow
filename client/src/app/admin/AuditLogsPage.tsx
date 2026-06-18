import { useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Eye, FileText, Filter } from 'lucide-react'
import { useAuditLogs } from '@/features/admin/hooks/useAuditLogs'
import {
  auditActorEmail,
  auditActorId,
  auditActorName,
  type AuditLog,
} from '@/features/admin/services/audit.api'
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

type Severity = 'info' | 'warning' | 'danger' | 'success'
type SeverityFilter = 'ALL' | Severity

const PAGE_SIZE = 25

const SEVERITY_FILTERS: Array<{ value: SeverityFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'danger', label: 'Danger' },
  { value: 'warning', label: 'Warning' },
  { value: 'success', label: 'Success' },
  { value: 'info', label: 'Info' },
]

const fmtDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '-')
const fmtDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : '-')

export default function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL')
  const [eventFilter, setEventFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      action: eventFilter === 'ALL' ? undefined : eventFilter,
    }),
    [eventFilter, page],
  )
  const { data, isLoading, isError } = useAuditLogs(queryParams)
  const logs = data?.logs ?? []
  const pagination = data?.pagination

  usePageChrome(
    {
      contextHeader: {
        title: 'Audit logs',
        breadcrumb: 'Admin · Security',
        status: (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
            {pagination?.total ?? 0}
          </span>
        ),
      },
    },
    [pagination?.total],
  )

  const eventOptions = useMemo(() => {
    const unique = Array.from(new Set(logs.map((log) => log.action))).sort()
    return ['ALL', ...unique]
  }, [logs])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return logs.filter((log) => {
      const severity = auditSeverity(log)
      if (severityFilter !== 'ALL' && severity !== severityFilter) return false
      if (!q) return true
      return [
        log.action,
        log.targetModel,
        log.targetId,
        auditActorName(log),
        auditActorEmail(log),
        JSON.stringify(log.metadata ?? {}),
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    })
  }, [logs, search, severityFilter])

  const selected = useMemo(
    () => logs.find((log) => log._id === selectedId) ?? null,
    [logs, selectedId],
  )

  const totalPages = Math.max(1, pagination?.totalPages ?? 1)
  const activePage = Math.min(page, totalPages)

  const setEvent = (value: string) => {
    setEventFilter(value)
    setSelectedId(null)
    setPage(1)
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <CommandBar
        searchPlaceholder="Search event, actor, target, or metadata..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="hidden items-center gap-1 2xl:flex">
              <Filter size={15} className="mr-1 text-muted-foreground" />
              {SEVERITY_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSeverityFilter(filter.value)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors',
                    severityFilter === filter.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary',
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <Select
              value={severityFilter}
              onValueChange={(value) => setSeverityFilter(value as SeverityFilter)}
            >
              <SelectTrigger className="h-9 w-full bg-secondary/50 2xl:hidden sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={setEvent}>
              <SelectTrigger className="h-9 w-full bg-secondary/50 sm:w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventOptions.map((event) => (
                  <SelectItem key={event} value={event}>
                    {event === 'ALL' ? 'All events' : labelizeEvent(event)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Inspect</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Loading audit logs...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-destructive">
                  Failed to load audit logs.
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-3 text-muted-foreground/50" size={36} strokeWidth={1.5} />
                  No audit logs match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((log) => (
                <TableRow
                  key={log._id}
                  data-state={selectedId === log._id ? 'selected' : undefined}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(log._id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <SeverityMark severity={auditSeverity(log)} />
                      <div className="min-w-0">
                        <div className="line-clamp-1 text-sm font-semibold text-foreground">
                          {labelizeEvent(log.action)}
                        </div>
                        <div className="font-mono text-[11px] font-semibold text-muted-foreground">{log.action}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-medium text-foreground">{auditActorName(log)}</div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">{auditActorEmail(log) ?? 'No email'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-medium text-foreground">{log.targetModel}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{shortId(log.targetId)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <SeverityPill severity={auditSeverity(log)} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(log.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Inspect audit log"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedId(log._id)
                      }}
                    >
                      <Eye size={15} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && !isError && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">
            Page <span className="font-semibold text-foreground">{activePage}</span> of{' '}
            <span className="font-semibold text-foreground">{totalPages}</span>
            {pagination && (
              <>
                {' '}
                · <span className="font-semibold text-foreground">{pagination.total}</span> total records
              </>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={activePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={activePage >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AuditLogDrawer
        log={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      />
    </div>
  )
}

function AuditLogDrawer({
  log,
  open,
  onOpenChange,
}: {
  log: AuditLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {log && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <SeverityMark severity={auditSeverity(log)} size="lg" />
                <div className="min-w-0">
                  <SheetTitle>{labelizeEvent(log.action)}</SheetTitle>
                  <SheetDescription>{fmtDateTime(log.createdAt)}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-5 text-sm">
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Severity</span>
                  <SeverityPill severity={auditSeverity(log)} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                  <Field label="Actor" value={auditActorName(log)} />
                  <Field label="Target" value={log.targetModel} />
                  <Field label="Created" value={fmtDate(log.createdAt)} />
                  <Field label="Updated" value={fmtDate(log.updatedAt)} />
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Event</h3>
                <div className="rounded-lg border border-border p-3">
                  <Row label="Action" value={<span className="font-mono text-xs">{log.action}</span>} />
                  <Row label="Entity type" value={log.targetModel} />
                  <Row label="Actor email" value={auditActorEmail(log) ?? '-'} />
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Metadata</h3>
                <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-secondary/30 p-3 text-xs leading-relaxed text-foreground">
                  {JSON.stringify(log.metadata ?? {}, null, 2)}
                </pre>
              </section>

              <details className="rounded-lg border border-border bg-secondary/30 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Reference ids</summary>
                <div className="mt-2 space-y-1 break-all font-mono text-[11px] text-muted-foreground">
                  <div>audit: {log._id}</div>
                  <div>actor: {auditActorId(log) ?? 'system'}</div>
                  <div>target: {log.targetId}</div>
                </div>
              </details>
            </div>

            <SheetFooter className="mt-8">
              <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function auditSeverity(log: AuditLog): Severity {
  const event = log.action.toUpperCase()
  const metadata = JSON.stringify(log.metadata ?? {}).toUpperCase()
  if (event.includes('REJECT') || event.includes('CANCEL') || metadata.includes('REJECT')) return 'danger'
  if (event.includes('WARNING') || event.includes('REVISION') || event.includes('TIE_BREAK')) return 'warning'
  if (event.includes('APPROVE') || event.includes('CREATED') || event.includes('SUBMITTED') || event.includes('ADDED')) {
    return 'success'
  }
  return 'info'
}

function labelizeEvent(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function shortId(value?: string) {
  if (!value) return '-'
  return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value
}

function SeverityMark({ severity, size = 'md' }: { severity: Severity; size?: 'md' | 'lg' }) {
  const Icon = {
    info: Clock,
    warning: AlertTriangle,
    danger: AlertTriangle,
    success: CheckCircle2,
  }[severity]

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border',
        size === 'lg' ? 'h-12 w-12' : 'h-9 w-9',
        severityClass(severity),
      )}
    >
      <Icon size={size === 'lg' ? 18 : 15} />
    </div>
  )
}

function SeverityPill({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-md border px-2 text-xs font-semibold capitalize',
        severityClass(severity),
      )}
    >
      {severity}
    </span>
  )
}

function severityClass(severity: Severity) {
  return {
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }[severity]
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
