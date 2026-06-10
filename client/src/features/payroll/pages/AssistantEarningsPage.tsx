import { useEffect, useState } from "react"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { listPayrollEarnings, type PayrollEarning } from "../api/payroll.api"

export function AssistantEarningsPage() {
  const [earnings, setEarnings] = useState<PayrollEarning[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  usePageTitle("Earnings", "Track approved task earnings and payout state.")

  async function load() {
    setLoading(true)
    setError(null)
    const res = await listPayrollEarnings()
    if (!res.success) setError(res.message ?? "Could not load earnings")
    else setEarnings(res.data ?? [])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const total = earnings.reduce((sum, item) => sum + Number(item.finalPayment ?? 0), 0)

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <MFBadge tone="primary">Payroll</MFBadge>
            <h1 className="mt-md text-headline-lg text-on-surface">Assistant earnings</h1>
            <p className="mt-sm text-body-md text-on-surface-muted">Backend filters this list to your own earnings.</p>
          </div>
          <div className="text-right">
            <p className="text-label-md text-on-surface-muted">Tracked total</p>
            <p className="text-headline-md text-on-surface">{total.toLocaleString()}</p>
          </div>
        </div>
      </MFCard>

      {loading ? <MFCard><MFSkeleton className="h-40 w-full" /></MFCard> : null}
      {error ? <MFErrorState title="Could not load earnings" description={error} onRetry={() => void load()} /> : null}
      {!loading && !error && earnings.length === 0 ? <MFEmptyState icon="payments" title="No earnings yet" description="Earnings appear after approved or rejected tasks are calculated." /> : null}
      {!loading && !error && earnings.length > 0 ? (
        <div className="grid gap-md">
          {earnings.map((earning) => (
            <MFCard key={earning.id ?? earning._id ?? earning.taskId}>
              <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-title-md text-on-surface">Task {earning.taskId}</p>
                  <p className="text-body-sm text-on-surface-muted">Base {earning.baseRate} x {earning.deadlineMultiplier}</p>
                </div>
                <div className="flex items-center gap-sm">
                  <MFBadge tone={earning.status === "PAID" ? "success" : "neutral"}>{earning.status}</MFBadge>
                  <span className="text-title-lg text-on-surface">{Number(earning.finalPayment).toLocaleString()}</span>
                </div>
              </div>
            </MFCard>
          ))}
        </div>
      ) : null}
    </PageShell>
  )
}