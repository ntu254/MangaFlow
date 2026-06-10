import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { useAdminDashboard } from "@/features/admin/hooks/useAdminDashboard"

export function AdminAuditLogsPage() {
  const { summary, loading, error, loadSummary } = useAdminDashboard()

  usePageTitle(
    "Audit Logs",
    "Review critical system, access, workflow, and storage events.",
  )

  if (loading) return <PageShell><MFCard><div className="h-64 rounded-3xl bg-surface-low" /></MFCard></PageShell>
  if (error) return <PageShell><MFErrorState title="Could not load audit data" description={error} onRetry={() => void loadSummary()} /></PageShell>

  const events = summary?.auditPreview ?? []
  const criticalCount = summary?.sidebarBadges?.criticalAuditEvents ?? 0

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap gap-sm">
          <MFBadge tone="primary" size="md">Admin only</MFBadge>
          <MFBadge tone="success" size="md">Backend enforced</MFBadge>
        </div>
        <h1 className="mt-md text-headline-lg text-on-surface">Audit logs</h1>
        <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
          Review critical system, access, workflow, and storage events. Full audit API is future scope; this page displays summary-level data from the dashboard service.
        </p>
      </MFCard>

      <section className="grid gap-lg md:grid-cols-3">
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Critical events</p>
          <p className="mt-sm text-headline-md text-on-surface">{criticalCount}</p>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Audit API</p>
          <MFBadge tone="warning" size="md" className="mt-sm">Future scope</MFBadge>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Retention</p>
          <p className="mt-sm text-headline-md text-on-surface">System-defined</p>
        </MFCard>
      </section>

      <MFCard>
        <h2 className="text-title-lg text-on-surface">Recent activity (dashboard summary)</h2>
        {events.length > 0 ? (
          <div className="mt-md grid gap-sm">
            {events.map((event, index) => (
              <div key={index} className="rounded-xl bg-surface-container p-md flex items-center gap-md">
                <span className="material-symbols-outlined text-on-surface-muted">receipt_long</span>
                <span className="text-body-md text-on-surface">{event}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-md text-body-md text-on-surface-muted">No audit events loaded from dashboard summary.</p>
        )}
      </MFCard>

      <MFCard>
        <h2 className="text-title-lg text-on-surface">Audit scope (MVP)</h2>
        <div className="mt-md grid gap-sm">
          {[
            { label: "User created (Admin)", status: "LOGGED" },
            { label: "Role changed (Admin)", status: "LOGGED_BY_TOKEN_REVOCATION" },
            { label: "Account suspended/activated", status: "LOGGED" },
            { label: "Board vote cast", status: "AUDITABLE_FUTURE" },
            { label: "Board decision finalized", status: "AUDITABLE_FUTURE" },
            { label: "Publication event", status: "AUDITABLE_FUTURE" },
            { label: "Signed URL access", status: "AUDITABLE_FUTURE" },
            { label: "Payroll confirmed/paid", status: "AUDITABLE_FUTURE" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl bg-surface-container p-md">
              <span className="text-body-md text-on-surface">{item.label}</span>
              <MFBadge tone={item.status === "LOGGED" || item.status === "LOGGED_BY_TOKEN_REVOCATION" ? "success" : "warning"} size="sm">{item.status}</MFBadge>
            </div>
          ))}
        </div>
      </MFCard>
    </PageShell>
  )
}