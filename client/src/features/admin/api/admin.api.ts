import { apiRequest } from "@/shared/api/client"

export interface AdminDashboardSummary {
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

export type AdminUserRole = "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD"

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminUserRole
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AdminCreateUserInput {
  email: string
  password: string
  name: string
  role: AdminUserRole
}

export function listAdminUsers() {
  return apiRequest<AdminUser[]>("/admin/users")
}

export function createAdminUser(input: AdminCreateUserInput) {
  return apiRequest<AdminUser>("/admin/users", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateAdminUserRole(userId: string, role: AdminUserRole) {
  return apiRequest<AdminUser>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  })
}

export function updateAdminUserStatus(userId: string, isActive: boolean) {
  return apiRequest<AdminUser>(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  })
}
