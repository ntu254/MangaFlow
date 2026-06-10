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

export interface AdminBoardMember {
  userId: string
  email?: string
  name?: string
  role?: AdminUserRole
  isUserActive: boolean
  isActive: boolean
  isChair: boolean
  createdAt?: string
  updatedAt?: string
}

export function listAdminBoardMembers() {
  return apiRequest<AdminBoardMember[]>("/admin/board-members")
}

export function createAdminBoardMember(userId: string) {
  return apiRequest<AdminBoardMember>("/admin/board-members", {
    method: "POST",
    body: JSON.stringify({ userId }),
  })
}

export function updateAdminBoardMemberStatus(userId: string, isActive: boolean) {
  return apiRequest<AdminBoardMember>(`/admin/board-members/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  })
}

export function assignAdminBoardChair(userId: string) {
  return apiRequest<AdminBoardMember>(`/admin/board-members/${userId}/chair`, {
    method: "PATCH",
    body: JSON.stringify({ isChair: true }),
  })
}

export interface AdminTaskType {
  id: string
  name: string
  description: string
  baseRate: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AdminTaskTypeInput {
  name: string
  description: string
  baseRate: number
}

export interface AdminTaskTypeUpdateInput {
  description?: string
  baseRate?: number
}

export function listAdminTaskTypes() {
  return apiRequest<AdminTaskType[]>("/admin/task-types")
}

export function createAdminTaskType(input: AdminTaskTypeInput) {
  return apiRequest<AdminTaskType>("/admin/task-types", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateAdminTaskType(taskTypeId: string, input: AdminTaskTypeUpdateInput) {
  return apiRequest<AdminTaskType>(`/admin/task-types/${taskTypeId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function updateAdminTaskTypeStatus(taskTypeId: string, isActive: boolean) {
  return apiRequest<AdminTaskType>(`/admin/task-types/${taskTypeId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  })
}

export function deleteAdminTaskType(taskTypeId: string) {
  return apiRequest<AdminTaskType | null>(`/admin/task-types/${taskTypeId}`, {
    method: "DELETE",
  })
}
