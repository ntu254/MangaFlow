import { useCallback, useEffect, useMemo, useState } from "react"
import {
  getAdminSidebarSummary,
  getApiHealth,
  type AdminDashboardSummary,
} from "../api/admin.api"

interface HealthCheck {
  key: string
  label: string
  status: string
  description: string
}

function statusDescription(key: string, status: string) {
  if (key === "api") return "Public health endpoint responded successfully."
  if (key === "db") return "Database status is reported by the backend-owned admin summary."
  if (key === "storage") return "Storage monitor is read-only until a dedicated storage endpoint exists."
  if (key === "ai") return "AI integration status is backend-owned; frontend does not call AI service directly."
  return `Backend reported ${status.split("_").join(" ").toLowerCase()}.`
}

export function useAdminSystemHealth() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)
  const [apiMessage, setApiMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadHealth = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [summaryResponse, healthResponse] = await Promise.all([
        getAdminSidebarSummary(),
        getApiHealth(),
      ])

      if (!summaryResponse.success || !summaryResponse.data) {
        setError(summaryResponse.message ?? "Could not load system health summary.")
        setSummary(null)
        setApiMessage("")
        return
      }

      if (!healthResponse.success) {
        setError(healthResponse.message ?? "API health endpoint did not return a healthy response.")
        setSummary(summaryResponse.data)
        setApiMessage("")
        return
      }

      setSummary(summaryResponse.data)
      setApiMessage(healthResponse.message ?? "MangaFlow API is running")
    } catch {
      setError("Could not reach MangaFlow system health APIs.")
      setSummary(null)
      setApiMessage("")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHealth()
  }, [loadHealth])

  const checks = useMemo<HealthCheck[]>(() => {
    if (!summary) return []

    return summary.systemHealth.map((item) => ({
      ...item,
      description: statusDescription(item.key, item.status),
    }))
  }, [summary])

  const warningCount = summary?.sidebarBadges.systemWarnings ?? 0
  const allReady = checks.length > 0 && warningCount === 0

  return {
    summary,
    apiMessage,
    checks,
    allReady,
    warningCount,
    loading,
    error,
    loadHealth,
  }
}
