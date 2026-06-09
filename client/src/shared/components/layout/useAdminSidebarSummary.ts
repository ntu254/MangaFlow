import { useEffect, useState } from "react"
import { getAdminSidebarSummary, type AdminDashboardSummary } from "@/features/admin/api/admin.api"

export function useAdminSidebarSummary(roleName: string) {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)

  useEffect(() => {
    if (roleName !== "ADMIN") return
    let active = true
    getAdminSidebarSummary()
      .then((res) => {
        if (active && res.success && res.data) setSummary(res.data)
      })
      .catch(() => {
        if (active) setSummary(null)
      })
    return () => {
      active = false
    }
  }, [roleName])

  return summary
}
