
import { useEffect, useState } from "react"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { listPayrollEarnings, type PayrollEarning } from "@/features/payroll/api/payroll.api"
import { listSeries } from "@/features/series/api/series.api"
import type { Series } from "@/features/series/api/series.types"

function statusTone(status: string) {
  if (status === "PAID") return "success"
  if (status === "CONFIRMED") return "primary"
  if (status === "PENDING") return "neutral"
  return "warning"
}

export function MangakaPayrollPage() {
  const [earnings, setEarnings] = useState<PayrollEarning[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  usePageTitle("Payroll", "Track earnings for assistants working on your series.")

  async function load() {
    setLoading(true)
    setError(null)
    const [earnRes, serRes] = await Promise.all([listPayrollEarnings(), listSeries()])
    if (!earnRes.success) setError(earnRes.message ?? "Could not load earnings")
    else setEarnings(earnRes.data ?? [])
    if (serRes.success) setSeries(serRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const seriesMap = Object.fromEntries(series.map(s => [s.id, s.title]))
  const total = earnings.reduce((sum, item) => sum + Number(item.finalPayment ?? 0), 0)

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <MFBadge tone="primary">Mangaka</MFBadge>
        <h1 className="mt-md text-headline-lg text-on-surface">Payroll summary</h1>
        <p className="mt-sm text-body-md text-on-surface-muted">Backend filters to series you own. All payment calculations are backend-owned.</p>
      </MFCard>
      {loading ? <MFCard><MFSkeleton className="h-40 w-full" /></MFCard> : null}
      {error ? <MFErrorState title="Could not load payroll" description={error} onRetry={() => void load()} /> : null}
      {!loading && !error && earnings.length === 0 ? <MFEmptyState icon="payments" title="No earnings yet" description="Earnings appear after tasks on your series are approved or rejected and calculated." /> : null}
      {!loading && !error && earnings.length > 0 ? (
        <div className="space-y-lg">
          <MFCard>
            <div className="flex items-center justify-between">
              <span className="text-title-lg text-on-surface">Tracked total</span>
              <span className="text-headline-md text-on-surface">{total.toLocaleString()}</span>
            </div>
          </MFCard>
          <div className="grid gap-md">
            {earnings.map(earning => (
              <MFCard key={earning.id ?? earning._id ?? earning.taskId}>
                <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-title-md text-on-surface">{seriesMap[earning.seriesId] ?? earning.seriesId}</p>
                    <p className="text-body-sm text-on-surface-muted">Task {earning.taskId} — Base {earning.baseRate} x {earning.deadlineMultiplier}</p>
                  </div>
                  <div className="flex items-center gap-sm">
                    <MFBadge tone={statusTone(earning.status)}>{earning.status}</MFBadge>
                    <span className="text-title-lg text-on-surface">{Number(earning.finalPayment).toLocaleString()}</span>
                  </div>
                </div>
              </MFCard>
            ))}
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}
