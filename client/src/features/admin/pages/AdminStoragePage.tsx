import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard, MFProgress } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { useAdminDashboard } from "@/features/admin/hooks/useAdminDashboard"

export function AdminStoragePage() {
  const { summary, loading, error, loadSummary } = useAdminDashboard()

  usePageTitle(
    "Storage Monitor",
    "Monitor R2/MinIO usage, file assets, and signed URL access warnings.",
  )

  if (loading) return <PageShell><MFCard><div className="h-64 rounded-3xl bg-surface-low" /></MFCard></PageShell>
  if (error) return <PageShell><MFErrorState title="Could not load storage data" description={error} onRetry={() => void loadSummary()} /></PageShell>

  const storage = summary?.storage ?? { usedLabel: "Monitoring", usagePercent: 0 }
  const warning = summary?.sidebarBadges?.storageWarning ?? false

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap gap-sm">
          <MFBadge tone="primary" size="md">Admin only</MFBadge>
          <MFBadge tone="success" size="md">Backend enforced</MFBadge>
        </div>
        <h1 className="mt-md text-headline-lg text-on-surface">Storage monitor</h1>
        <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
          Monitor R2/MinIO bucket usage, file asset counts, and signed URL access. All file access is backend-enforced; Admin cannot bypass signed URL security.
        </p>
      </MFCard>

      <section className="grid gap-lg md:grid-cols-2">
        <MFCard>
          <h2 className="text-title-lg text-on-surface">Usage overview</h2>
          <div className="mt-md">
            <div className="flex items-center justify-between">
              <span className="text-label-md text-on-surface-muted">Current usage</span>
              <span className="text-headline-md text-on-surface">{storage.usagePercent}%</span>
            </div>
            <MFProgress value={storage.usagePercent} className="mt-sm" />
            <p className="mt-sm text-label-sm text-on-surface-muted">{storage.usedLabel}</p>
          </div>
          {warning ? (
            <MFBadge tone="warning" size="md" className="mt-md">Storage usage near limit — review file assets.</MFBadge>
          ) : (
            <MFBadge tone="success" size="md" className="mt-md">Storage usage is within normal range.</MFBadge>
          )}
        </MFCard>

        <MFCard>
          <h2 className="text-title-lg text-on-surface">File security</h2>
          <div className="mt-md grid gap-sm">
            <div className="flex items-center justify-between rounded-xl bg-surface-container p-md">
              <span className="text-body-md text-on-surface">Private storage</span>
              <MFBadge tone="success" size="sm">Enabled</MFBadge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-container p-md">
              <span className="text-body-md text-on-surface">Signed URL access</span>
              <MFBadge tone="success" size="sm">Backend-owned</MFBadge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-container p-md">
              <span className="text-body-md text-on-surface">Assistant file scope</span>
              <MFBadge tone="success" size="sm">Task-only</MFBadge>
            </div>
          </div>
          <p className="mt-md text-body-sm text-on-surface-muted">
            Files are stored privately. Access is granted only through backend-validated signed URLs. Assistant file access is task-scoped and cannot be broadened by SeriesMember membership alone.
          </p>
        </MFCard>
      </section>

      <MFCard>
        <h2 className="text-title-lg text-on-surface">Access policy boundary</h2>
        <div className="mt-md rounded-2xl bg-surface-container-low p-lg">
          <p className="text-body-md text-on-surface">
            Admin can monitor storage usage and configuration status, but cannot override file access policies.
            Signed URL generation requires backend access-policy validation. File storage boundaries are defined in
            the MangaFlow security contract and enforced by <code>FileAccessPolicy</code>.
          </p>
        </div>
      </MFCard>
    </PageShell>
  )
}