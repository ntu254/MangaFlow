import { SeriesListPanel } from "@/features/series/components/SeriesListPanel"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { useAdminSeriesMonitor } from "../hooks/useAdminSeriesMonitor"

export function AdminSeriesMonitorPage() {
  const monitor = useAdminSeriesMonitor()

  usePageTitle(
    "Series Monitor",
    "Read-only system view of Series records. Admin observes workflow state but cannot approve, reject, publish, or override Board decisions.",
  )

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-sm">
              <MFBadge tone="primary" size="md">Admin monitor</MFBadge>
              <MFBadge tone="neutral" size="md">Read-only</MFBadge>
            </div>
            <h1 className="mt-md text-headline-lg text-on-surface">Series Monitor</h1>
            <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
              View Series status across the studio without taking creative workflow actions. Board approval, manuscript review, publication readiness, and chapter creation gates remain backend-owned.
            </p>
          </div>
        </div>
      </MFCard>

      <section className="grid gap-lg md:grid-cols-3">
        <MFCard><p className="text-label-sm text-on-surface-muted">Total Series</p><p className="mt-sm text-headline-md text-on-surface">{monitor.seriesList.length}</p></MFCard>
        <MFCard><p className="text-label-sm text-on-surface-muted">Pending review</p><p className="mt-sm text-headline-md text-on-surface">{monitor.pendingReviewCount}</p></MFCard>
        <MFCard><p className="text-label-sm text-on-surface-muted">Production-visible</p><p className="mt-sm text-headline-md text-on-surface">{monitor.productionCount}</p></MFCard>
      </section>

      {monitor.loading ? (
        <MFCard><MFSkeleton className="h-40 w-full" /></MFCard>
      ) : monitor.error ? (
        <MFErrorState title="Could not load Series monitor" description={monitor.error} onRetry={() => void monitor.loadSeries()} />
      ) : monitor.seriesRows.length > 0 ? (
        <SeriesListPanel
          rows={monitor.seriesRows}
          mode="monitor"
          readOnly
          showChapterGate={false}
        />
      ) : (
        <MFEmptyState
          icon="auto_stories"
          title="No Series records"
          description="Series records will appear here after backend access rules return monitor data."
        />
      )}
    </PageShell>
  )
}

