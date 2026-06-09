import { useCallback, useEffect, useState } from "react"
import { getAdminSidebarSummary, type AdminDashboardSummary } from "../api/admin.api"

export function useAdminDashboard() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getAdminSidebarSummary()
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load admin dashboard.")
        setSummary(null)
        return
      }
      setSummary(response.data)
    } catch {
      setError("Could not reach MangaFlow. Check API server and try again.")
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  return { summary, loading, error, loadSummary }
}
