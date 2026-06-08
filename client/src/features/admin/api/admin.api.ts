import { apiRequest } from "@/shared/api/client"

export interface AdminDashboardSummary {
  stats: {
    activeUsers: number
    totalSeries: number
    activeTasks: number
    boardMembers: number
    activeTaskTypes: number
  }
  systemHealth: Array<{
    key: string
    label: string
    status: string
  }>
  storage: {
    usedLabel: string
    usagePercent: number
  }
  auditPreview: string[]
}

export function getAdminSidebarSummary() {
  return apiRequest<AdminDashboardSummary>("/dashboard/admin/sidebar-summary")
}
