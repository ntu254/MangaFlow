import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { AdminTaskRateDialog } from "../components/AdminTaskRateDialog"
import { AdminTaskRatesTable } from "../components/AdminTaskRatesTable"
import { useAdminTaskRates } from "../hooks/useAdminTaskRates"

export function AdminTaskRatesPage() {
  const taskRates = useAdminTaskRates()

  usePageTitle(
    "Task Rates",
    "Audit and update default TaskType base rates for future assignments without changing existing task payroll snapshots.",
  )

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-sm">
              <MFBadge tone="primary" size="md">Admin only</MFBadge>
              <MFBadge tone="success" size="md">Backend enforced</MFBadge>
              <MFBadge tone="neutral" size="md">Future assignments only</MFBadge>
            </div>
            <h1 className="mt-md text-headline-lg text-on-surface">Task Rates</h1>
            <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
              Configure default base-rate references on TaskType records. Existing tasks keep their stored base-rate snapshot for payroll calculations.
            </p>
          </div>
        </div>
      </MFCard>

      <section className="grid gap-lg md:grid-cols-3">
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Active rate references</p>
          <p className="mt-sm text-headline-md text-on-surface">{taskRates.activeRateCount}</p>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Zero-rate warnings</p>
          <p className="mt-sm text-headline-md text-on-surface">{taskRates.zeroRateCount}</p>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Average default rate</p>
          <p className="mt-sm text-headline-md text-on-surface">{taskRates.averageBaseRate.toLocaleString()}</p>
        </MFCard>
      </section>

      {taskRates.error ? <MFErrorState title="Could not load task rates" description={taskRates.error} onRetry={() => void taskRates.loadTaskRates()} /> : null}
      {taskRates.message ? <MFBadge tone="neutral" size="md">{taskRates.message}</MFBadge> : null}

      <AdminTaskRatesTable
        taskTypes={taskRates.taskTypes}
        loading={taskRates.loading}
        onEdit={taskRates.setEditingTaskType}
      />

      <AdminTaskRateDialog
        taskType={taskRates.editingTaskType}
        submitting={taskRates.submitting}
        onClose={() => taskRates.setEditingTaskType(null)}
        onUpdate={taskRates.handleUpdateRate}
      />
    </PageShell>
  )
}
