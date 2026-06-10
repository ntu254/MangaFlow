import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFButton, MFCard, MFProgress } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { useAdminSystemHealth } from "../hooks/useAdminSystemHealth"

function healthTone(status: string): "success" | "warning" | "neutral" {
  if (status === "OPERATIONAL" || status === "CONFIGURED") return "success"
  if (status.includes("PENDING") || status === "WARNING") return "warning"
  return "neutral"
}

function readinessPercent(total: number, warnings: number) {
  if (total === 0) return 0
  return Math.max(0, Math.round(((total - warnings) / total) * 100))
}

export function AdminSystemHealthPage() {
  const health = useAdminSystemHealth()

  usePageTitle(
    "System Health",
    "Read-only health monitor for API, database, storage, AI integration, and runtime warnings.",
  )

  if (health.loading) {
    return (
      <PageShell>
        <MFCard padding="lg" className="rounded-3xl">
          <MFSkeleton className="h-8 w-48" />
          <MFSkeleton className="mt-md h-20 w-full rounded-3xl" />
        </MFCard>
        <section className="grid gap-lg md:grid-cols-3">
          <MFSkeleton className="h-32 w-full rounded-3xl" />
          <MFSkeleton className="h-32 w-full rounded-3xl" />
          <MFSkeleton className="h-32 w-full rounded-3xl" />
        </section>
      </PageShell>
    )
  }

  if (health.error) {
    return (
      <MFErrorState
        title="Could not load system health"
        description={health.error}
        onRetry={() => void health.loadHealth()}
      />
    )
  }

  const readiness = readinessPercent(health.checks.length, health.warningCount)

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-sm">
              <MFBadge tone="primary" size="md">Admin monitor</MFBadge>
              <MFBadge tone="neutral" size="md">Read-only</MFBadge>
              <MFBadge tone={health.allReady ? "success" : "warning"} size="md">
                {health.allReady ? "No warnings" : `${health.warningCount} warning${health.warningCount === 1 ? "" : "s"}`}
              </MFBadge>
            </div>
            <h1 className="mt-md text-headline-lg text-on-surface">System Health</h1>
            <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
              Monitor backend-owned service health without exposing storage objects, signed URLs, AI service calls, or workflow override actions.
            </p>
          </div>
          <MFButton type="button" variant="outline" onClick={() => void health.loadHealth()}>
            Refresh health
          </MFButton>
        </div>
      </MFCard>

      <section className="grid gap-lg md:grid-cols-3">
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">API health</p>
          <p className="mt-sm text-title-lg text-on-surface">{health.apiMessage || "Healthy"}</p>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Readiness score</p>
          <p className="mt-sm text-headline-md text-on-surface">{readiness}%</p>
          <div className="mt-md"><MFProgress value={readiness} /></div>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Storage monitor</p>
          <p className="mt-sm text-title-lg text-on-surface">{health.summary?.storage.usedLabel ?? "Unavailable"}</p>
          <p className="mt-xs text-label-sm text-on-surface-muted">No signed file URLs are requested on this page.</p>
        </MFCard>
      </section>

      {health.checks.length > 0 ? (
        <section className="grid gap-lg lg:grid-cols-2">
          {health.checks.map((item) => (
            <MFCard key={item.key} className="rounded-3xl">
              <div className="flex items-start justify-between gap-md">
                <div>
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary" aria-hidden="true">
                      monitor_heart
                    </span>
                    <h2 className="text-title-lg text-on-surface">{item.label}</h2>
                  </div>
                  <p className="mt-sm text-body-md text-on-surface-muted">{item.description}</p>
                </div>
                <MFBadge tone={healthTone(item.status)} size="md">
                  {item.status.split("_").join(" ")}
                </MFBadge>
              </div>
            </MFCard>
          ))}
        </section>
      ) : (
        <MFEmptyState
          icon="monitor_heart"
          title="No health checks returned"
          description="Backend-owned health checks will appear here after the admin summary endpoint returns service status data."
        />
      )}

      <MFCard>
        <h2 className="text-title-lg text-on-surface">Boundary notes</h2>
        <ul className="mt-md list-disc space-y-xs pl-lg text-body-md text-on-surface-muted">
          <li>Admin can monitor system status but cannot override Board decisions.</li>
          <li>Storage status is summarized only; this page does not fetch private files or signed URLs.</li>
          <li>AI service status is backend-mediated; the frontend never calls the AI service directly.</li>
        </ul>
      </MFCard>
    </PageShell>
  )
}
