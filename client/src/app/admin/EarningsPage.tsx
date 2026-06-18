import { useMemo, useState, type ReactNode } from "react"
import { Wallet, Filter } from "lucide-react"
import { usePayrollEarnings, useMarkEarningPaid } from "@/features/payroll/hooks/usePayroll"
import {
  type PayrollEarning, type EarningStatus,
  earningAssistant, earningTask, earningAssistantId, earningTaskId,
} from "@/features/payroll/services/payroll.api"
import { usePageChrome } from "@/shared/components/layout/page-chrome"
import { CommandBar } from "@/shared/components/ui/command-bar"
import { StatusBadge } from "@/shared/components/ui/status-badge"
import { earningStatusUi, taskStatusUi } from "@/shared/lib/status-ui"
import { Button } from "@/shared/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/shared/components/ui/sheet"
import { cn } from "@/shared/lib/utils"

const STATUS_FILTERS: Array<{ value: "ALL" | EarningStatus; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PAID", label: "Paid" },
]

const fmtAmount = (n: number) => new Intl.NumberFormat("en-US").format(n)
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString() : "—")
const badge = (status: string) => earningStatusUi[status] ?? earningStatusUi.PENDING
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

export default function AdminEarningsPage() {
  const { data = [], isLoading, isError } = usePayrollEarnings()
  const markPaid = useMarkEarningPaid()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | EarningStatus>("ALL")
  const [selected, setSelected] = useState<PayrollEarning | null>(null)

  usePageChrome(
    {
      contextHeader: {
        title: "Earnings",
        breadcrumb: "Admin · Payroll",
        status: (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
            {data.length}
          </span>
        ),
      },
    },
    [data.length]
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((e) => {
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false
      if (!q) return true
      const a = earningAssistant(e)
      const t = earningTask(e)
      return [a?.name, a?.email, t?.title, t?.taskTypeId?.name]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    })
  }, [data, search, statusFilter])

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <CommandBar
        searchPlaceholder="Search by assistant name, email, or task..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <div className="hidden items-center gap-1 sm:flex">
            <Filter size={15} className="mr-1 text-muted-foreground" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
                  statusFilter === f.value ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-secondary"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assistant</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Calculated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Loading earnings...</TableCell></TableRow>
            ) : isError ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-rose-500">Failed to load earnings.</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                  <Wallet className="mx-auto mb-3 text-slate-300" size={36} strokeWidth={1.5} />
                  No earnings match the current filter.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((e) => {
                const a = earningAssistant(e)
                const t = earningTask(e)
                return (
                  <TableRow
                    key={e._id}
                    data-state={selected?._id === e._id ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => setSelected(e)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                          {a ? initials(a.name) : "?"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">{a?.name ?? "Unknown assistant"}</span>
                          <span className="text-xs text-muted-foreground">{a?.email ?? "—"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <span className="line-clamp-1 text-sm font-medium text-slate-800">{t?.title ?? "Untitled task"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {t?.taskTypeId?.name ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900 tabular-nums">{fmtAmount(e.finalPayment)}</TableCell>
                    <TableCell>
                      {e.isLate ? (
                        <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">Late</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">On time</span>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge config={badge(e.status)} size="sm" /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(e.calculatedAt)}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (() => {
            const a = earningAssistant(selected)
            const t = earningTask(selected)
            return (
              <>
                <SheetHeader>
                  <div className="flex items-center gap-2">
                    <SheetTitle>{a?.name ?? "Unknown assistant"}</SheetTitle>
                    <StatusBadge config={badge(selected.status)} size="sm" />
                  </div>
                  <SheetDescription>{a?.email ?? "Assistant earning record."}</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-5 text-sm">
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Final payment</span>
                      <span className="text-xl font-bold text-slate-900 tabular-nums">{fmtAmount(selected.finalPayment)}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                      <Field label="Base rate" value={fmtAmount(selected.baseRate)} />
                      <Field label="Deadline ×" value={`×${selected.deadlineMultiplier}`} />
                      <Field label="Late" value={selected.isLate ? "Yes" : "No"} />
                      <Field label="Status" value={badge(selected.status).label} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task</h3>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                      <span className="line-clamp-1 text-sm font-medium text-slate-800">{t?.title ?? "Untitled task"}</span>
                      {t?.status && <StatusBadge config={taskStatusUi[t.status] ?? earningStatusUi.PENDING} size="sm" />}
                    </div>
                    {t?.taskTypeId && (
                      <p className="text-xs text-muted-foreground">Type: {t.taskTypeId.name} ({t.taskTypeId.code})</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeline</h3>
                    <Row label="Calculated" value={fmtDate(selected.calculatedAt)} />
                    <Row label="Confirmed" value={fmtDate(selected.confirmedAt)} />
                    <Row label="Paid" value={fmtDate(selected.paidAt)} />
                  </div>

                  <details className="rounded-lg border border-border bg-secondary/30 p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Reference ids</summary>
                    <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-500">
                      <div>earning: {selected._id}</div>
                      <div>assistant: {earningAssistantId(selected)}</div>
                      <div>task: {earningTaskId(selected)}</div>
                      <div>series: {selected.seriesId}</div>
                      <div>chapter: {selected.chapterId}</div>
                    </div>
                  </details>
                </div>

                <SheetFooter className="mt-8">
                  <Button
                    className="w-full"
                    disabled={selected.status === "PAID" || markPaid.isPending}
                    onClick={() => markPaid.mutate(selected._id, { onSuccess: (res) => setSelected(res.data.data) })}
                  >
                    {selected.status === "PAID" ? "Already paid" : "Mark as paid"}
                  </Button>
                </SheetFooter>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  )
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  )
}
