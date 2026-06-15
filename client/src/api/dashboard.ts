import { apiClient } from "@/lib/axios"
import type { ApiResponse } from "@/types"

export interface AdminSidebarSummary {
  stats: {
    activeUsers: number
    totalSeries: number
    activeTasks: number
    boardMembers: number
    activeTaskTypes: number
  }
  sidebarBadges: {
    suspendedUsers: number
    seriesPendingReview: number
    missingBoardChair: boolean
    inactiveTaskTypes: number
    taskRateWarnings: number
    pendingPayrollConfirmations: number
    storageWarning: boolean
    aiUnhealthy: boolean
    criticalAuditEvents: number
    systemWarnings: number
    unreadNotifications: number
  }
}

export const dashboardApi = {
  getAdminSidebarSummary: () =>
    apiClient.get<ApiResponse<AdminSidebarSummary>>("/dashboard/admin/sidebar-summary"),
}
