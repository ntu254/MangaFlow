import { useEffect, useState } from "react"
import { AdminStatCard } from "../components/AdminStatCard"
import { AdminUserTable } from "../components/AdminUserTable"
import { AdminSystemHealth } from "../components/AdminSystemHealth"
import { AdminActivityLog } from "../components/AdminActivityLog"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { MFCard } from "@/shared/components/ui"
import { MFErrorState } from "@/shared/components/feedback/MFErrorState"
import { getAdminSidebarSummary, type AdminDashboardSummary } from "../api/admin.api"

export function AdminDashboardPage() {
  usePageTitle("Dashboard Overview", "Monitor system metrics and recent activities.")

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadSummary() {
    setLoading(true)
    setError("")
    try {
      const response = await getAdminSidebarSummary()
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load admin dashboard.")
        setSummary(null)
      } else {
        setSummary(response.data)
      }
    } catch {
      setError("Could not reach MangaFlow. Check API server and try again.")
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadSummary() }, [])

  if (loading) {
    return <MFCard><div className="h-64 rounded-3xl bg-surface-low" /></MFCard>
  }

  if (error) {
    return <MFErrorState title="Could not load admin dashboard" description={error} onRetry={() => void loadSummary()} />
  }

  if (!summary) {
    return <MFErrorState title="Admin dashboard unavailable" description="No dashboard summary was returned by the API." onRetry={() => void loadSummary()} />
  }

  return (
    <div className="space-y-md pr-1">
      <div className="grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard icon="groups" iconBg="bg-primary-fixed" iconColor="text-on-primary-fixed" value={summary.stats.activeUsers.toLocaleString()} label="Total Active Users" />
        <AdminStatCard icon="auto_stories" iconBg="bg-secondary-fixed" iconColor="text-on-secondary-fixed" value={summary.stats.totalSeries.toLocaleString()} label="Total Series" />
        <AdminStatCard icon="assignment" iconBg="bg-tertiary-fixed" iconColor="text-on-tertiary-fixed" value={summary.stats.activeTasks.toLocaleString()} label="Active Assistant Tasks" />
        <AdminStatCard icon="cloud" iconBg="bg-surface-container-highest" iconColor="text-on-surface-variant" value={summary.storage.usedLabel} label="Storage Usage" progress={{ value: summary.storage.usagePercent, color: "bg-error" }} />
      </div>

      <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
        <div className="space-y-md lg:col-span-2">
          <AdminUserTable />
        </div>
        <div className="space-y-md">
          <AdminSystemHealth items={summary.systemHealth} />
          <AdminActivityLog entries={summary.auditPreview} />
        </div>
      </div>
    </div>
  )
}
