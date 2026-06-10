import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { PageShell } from "@/shared/components/layout/PageShell"
import { MFBadge, MFCard } from "@/shared/components/ui"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { useAdminDashboard } from "@/features/admin/hooks/useAdminDashboard"

export function AdminAiServicePage() {
  const { summary, loading, error, loadSummary } = useAdminDashboard()

  usePageTitle(
    "AI Service Monitor",
    "Monitor AI health and bubble detect/process integration status through backend-owned checks.",
  )

  if (loading) return <PageShell><MFCard><div className="h-64 rounded-3xl bg-surface-low" /></MFCard></PageShell>
  if (error) return <PageShell><MFErrorState title="Could not load AI service data" description={error} onRetry={() => void loadSummary()} /></PageShell>

  const aiStatus = summary?.systemHealth?.find((h) => h.key === "ai")?.status ?? "UNKNOWN"
  const aiUnhealthy = summary?.sidebarBadges?.aiUnhealthy ?? false

  return (
    <PageShell>
      <MFCard padding="lg" className="rounded-3xl">
        <div className="flex flex-wrap gap-sm">
          <MFBadge tone="primary" size="md">Admin only</MFBadge>
          <MFBadge tone="success" size="md">Backend enforced</MFBadge>
        </div>
        <h1 className="mt-md text-headline-lg text-on-surface">AI service monitor</h1>
        <p className="mt-sm max-w-3xl text-body-md text-on-surface-muted">
          Monitor AI service health and bubble detect/process integration. All AI processing and output storage is backend-owned; Admin monitors status but cannot bypass AI output security boundaries.
        </p>
      </MFCard>

      <section className="grid gap-lg md:grid-cols-3">
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Status</p>
          <MFBadge tone={aiUnhealthy ? "warning" : "success"} size="md" className="mt-sm">{aiStatus}</MFBadge>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Integration</p>
          <p className="mt-sm text-headline-md text-on-surface">{aiStatus === "OPERATIONAL" ? "Connected" : "Pending"}</p>
        </MFCard>
        <MFCard>
          <p className="text-label-sm text-on-surface-muted">Bubble detect</p>
          <MFBadge tone={aiStatus === "OPERATIONAL" ? "success" : "neutral"} size="md" className="mt-sm">{
            aiStatus === "OPERATIONAL" ? "Active" : "Awaiting integration"
          }</MFBadge>
        </MFCard>
      </section>

      <MFCard>
        <h2 className="text-title-lg text-on-surface">Security boundary</h2>
        <div className="mt-md rounded-2xl bg-surface-container-low p-lg">
          <p className="text-body-md text-on-surface">
            AI output is never stored as base64 in the database. AI processing runs through backend-owned services.
            Admin can monitor AI health and integration status, but cannot access raw AI processing pipelines,
            override output validation, or bypass the AI output storage boundary.
          </p>
        </div>
      </MFCard>

      <MFCard>
        <h2 className="text-title-lg text-on-surface">Integration checklist</h2>
        <div className="mt-md grid gap-sm">
          {[
            { label: "Bubble detect endpoint", status: aiStatus === "OPERATIONAL" ? "OPERATIONAL" : "PENDING_INTEGRATION" },
            { label: "Bubble process endpoint", status: aiStatus === "OPERATIONAL" ? "OPERATIONAL" : "PENDING_INTEGRATION" },
            { label: "AI output storage (private)", status: "CONFIGURED" },
            { label: "Base64 DB storage", status: "FORBIDDEN", tone: "success" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl bg-surface-container p-md">
              <span className="text-body-md text-on-surface">{item.label}</span>
              <MFBadge tone={item.tone as "success" | "warning" | "neutral" ?? (item.status === "OPERATIONAL" || item.status === "CONFIGURED" ? "success" : item.status.includes("PENDING") ? "warning" : "neutral")} size="sm">{item.status}</MFBadge>
            </div>
          ))}
        </div>
      </MFCard>
    </PageShell>
  )
}