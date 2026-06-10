import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { AdminPayrollTable } from "../components/AdminPayrollTable"
import { useAdminPayroll } from "../hooks/useAdminPayroll"

export function AdminPayrollPage() {
  const payroll = useAdminPayroll()

  usePageTitle(
    "Payroll",
    "Track assistant earnings from backend-calculated records. MangaFlow MVP does not execute real payments.",
  )

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-sm">
              <MFBadge tone="primary" size="md">Admin only</MFBadge>
              <MFBadge tone="success" size="md">Backend enforced</MFBadge>
              <MFBadge tone="neutral" size="md">Tracking only</MFBadge>
            </div>
            <h1 className="mt-md text-headline-lg text-on-surface">Payroll Tracking</h1>
            <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
              Monitor assistant earnings and move backend records through tracking statuses. Amounts are calculated by the payroll service from task snapshots.
            </p>
          </div>
        </div>
      </MFCard>

      <section className="grid gap-lg md:grid-cols-4">
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Pending confirmations</p>
          <p className="mt-sm text-headline-md text-on-surface">{payroll.summary.pending}</p>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Confirmed amount</p>
          <p className="mt-sm text-headline-md text-on-surface">{payroll.summary.confirmedAmount.toLocaleString()}</p>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Paid tracking amount</p>
          <p className="mt-sm text-headline-md text-on-surface">{payroll.summary.paidAmount.toLocaleString()}</p>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Late earnings</p>
          <p className="mt-sm text-headline-md text-on-surface">{payroll.summary.late}</p>
        </MFCard>
      </section>

      {payroll.error ? <MFErrorState title="Could not load payroll" description={payroll.error} onRetry={() => void payroll.loadEarnings()} /> : null}
      {payroll.message ? <MFBadge tone="neutral" size="md">{payroll.message}</MFBadge> : null}

      <AdminPayrollTable
        earnings={payroll.earnings}
        loading={payroll.loading}
        updatingEarningId={payroll.updatingEarningId}
        onConfirm={(earning) => void payroll.handleConfirm(earning)}
        onMarkPaid={(earning) => void payroll.handleMarkPaid(earning)}
      />
    </PageShell>
  )
}
