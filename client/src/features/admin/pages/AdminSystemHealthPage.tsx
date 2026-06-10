import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { useAdminDashboard } from "@/features/admin/hooks/useAdminDashboard"

export function AdminSystemHealthPage() {
  const { summary, loading, error, loadSummary } = useAdminDashboard()

  usePageTitle("System Health", "Monitor MongoDB, API, storage, AI, env warnings, and runtime hardening status.")

  if (loading) return <PageShell><MFCard><div className="h-64 rounded-3xl bg-surface-low" /></MFCard></PageShell>
  if (error) return <PageShell><MFErrorState title="Could not load system health" description={error} onRetry={() => void loadSummary()} /></PageShell>
  if (!summary) return <PageShell><MFErrorState title="System health unavailable" description="No health data was returned by the API." onRetry={() => void loadSummary()} /></PageShell>

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <MFBadge tone="primary">Admin</MFBadge>
        <h1 className="mt-md text-headline-lg text-on-surface">System health overview</h1>
        <p className="mt-sm text-body-md text-on-surface-muted">Runtime hardening: no hardcoded credentials, production env validated, MongoDB connection required at startup.</p>
      </MFCard>

      <section className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        {summary.systemHealth.map((item) => {
          const tone = item.status === "OPERATIONAL" ? "success" : item.status === "WARNING" ? "warning" : "danger"
          return (
            <MFCard key={item.key}>
              <div className="flex flex-col gap-sm">
                <span className="text-label-md text-on-surface-muted">{item.label}</span>
                <span className="text-headline-sm text-on-surface">{item.key}</span>
                <MFBadge tone={tone as "success" | "warning" | "danger"} size="md">{item.status}</MFBadge>
              </div>
            </MFCard>
          )
        })}
      </section>

      <section className="grid gap-md sm:grid-cols-2">
        <MFCard>
          <h2 className="text-title-lg text-on-surface">Environment flags</h2>
          <div className="mt-md grid gap-sm">
            {summary.sidebarBadges.systemWarnings > 0 ? <MFBadge tone="warning">System warnings: {summary.sidebarBadges.systemWarnings}</MFBadge> : <MFBadge tone="success">No system warnings</MFBadge>}
            {summary.sidebarBadges.missingBoardChair ? <MFBadge tone="warning">Missing Board Chair</MFBadge> : <MFBadge tone="success">Board Chair assigned</MFBadge>}
            {summary.sidebarBadges.storageWarning ? <MFBadge tone="warning">Storage usage warning</MFBadge> : <MFBadge tone="success">Storage OK</MFBadge>}
            {summary.sidebarBadges.aiUnhealthy ? <MFBadge tone="warning">AI integration pending</MFBadge> : <MFBadge tone="success">AI service operational</MFBadge>}
          </div>
        </MFCard>
        <MFCard>
          <h2 className="text-title-lg text-on-surface">Quick stats</h2>
          <div className="mt-md grid gap-xs text-body-md text-on-surface">
            <div className="flex justify-between"><span>Active users</span><span className="text-on-surface-muted">{summary.stats.activeUsers}</span></div>
            <div className="flex justify-between"><span>Total series</span><span className="text-on-surface-muted">{summary.stats.totalSeries}</span></div>
            <div className="flex justify-between"><span>Active tasks</span><span className="text-on-surface-muted">{summary.stats.activeTasks}</span></div>
            <div className="flex justify-between"><span>Board members</span><span className="text-on-surface-muted">{summary.stats.boardMembers}</span></div>
            <div className="flex justify-between"><span>Suspended users</span><span className="text-on-surface-muted">{summary.sidebarBadges.suspendedUsers}</span></div>
            <div className="flex justify-between"><span>Pending payroll</span><span className="text-on-surface-muted">{summary.sidebarBadges.pendingPayrollConfirmations}</span></div>
          </div>
        </MFCard>
      </section>
    </PageShell>
  )
}