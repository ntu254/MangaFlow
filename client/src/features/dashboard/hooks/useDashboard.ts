import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/features/dashboard/services/dashboard.api"

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: ["admin", "dashboard-summary"],
    queryFn: async () => {
      const { data } = await dashboardApi.getAdminSidebarSummary()
      return data.data
    },
  })
}
