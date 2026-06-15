import { apiClient } from "@/lib/axios"
import type { ApiResponse } from "@/types"

// ==================== USERS ====================
export interface AdminUser {
  id: string
  email: string
  name: string
  displayName?: string
  team?: string
  notes?: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  email: string
  password: string
  name: string
  displayName?: string
  team?: string
  notes?: string
  role: string
  isActive?: boolean
}

export interface UpdateUserRoleInput {
  role: string
}

export interface UpdateUserInput {
  email?: string
  name?: string
  displayName?: string
  team?: string
  notes?: string
  role?: string
  isActive?: boolean
}

export interface UpdateUserStatusInput {
  isActive: boolean
}

export const adminUsersApi = {
  list: () =>
    apiClient.get<ApiResponse<AdminUser[]>>("/admin/users"),
  create: (data: CreateUserInput) =>
    apiClient.post<ApiResponse<AdminUser>>("/admin/users", data),
  update: (userId: string, data: UpdateUserInput) =>
    apiClient.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}`, data),
  delete: (userId: string) =>
    apiClient.delete<ApiResponse<AdminUser>>(`/admin/users/${userId}`),
  updateRole: (userId: string, data: UpdateUserRoleInput) =>
    apiClient.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}/role`, data),
  updateStatus: (userId: string, data: UpdateUserStatusInput) =>
    apiClient.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}/status`, data),
}

// ==================== BOARD MEMBERS ====================
export interface AdminBoardMember {
  userId: string
  email: string
  name: string
  role: string
  isUserActive: boolean
  isActive: boolean
  isChair: boolean
  createdAt: string
  updatedAt: string
}

export interface AddBoardMemberInput {
  userId: string
}

export interface UpdateBoardMemberStatusInput {
  isActive: boolean
}

export interface SetBoardChairInput {
  isChair: boolean
}

export const adminBoardApi = {
  list: () =>
    apiClient.get<ApiResponse<AdminBoardMember[]>>("/admin/board-members"),
  add: (data: AddBoardMemberInput) =>
    apiClient.post<ApiResponse<AdminBoardMember>>("/admin/board-members", data),
  updateStatus: (userId: string, data: UpdateBoardMemberStatusInput) =>
    apiClient.patch<ApiResponse<AdminBoardMember>>(`/admin/board-members/${userId}/status`, data),
  setChair: (userId: string, data: SetBoardChairInput) =>
    apiClient.patch<ApiResponse<AdminBoardMember>>(`/admin/board-members/${userId}/chair`, data),
}

// ==================== TASK TYPES ====================
export interface AdminTaskType {
  id: string
  name: string
  description: string
  baseRate: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTaskTypeInput {
  name: string
  description: string
  baseRate: number
}

export interface UpdateTaskTypeInput {
  name?: string
  description?: string
  baseRate?: number
}

export interface UpdateTaskTypeStatusInput {
  isActive: boolean
}

export const adminTaskTypesApi = {
  list: () =>
    apiClient.get<ApiResponse<AdminTaskType[]>>("/admin/task-types"),
  create: (data: CreateTaskTypeInput) =>
    apiClient.post<ApiResponse<AdminTaskType>>("/admin/task-types", data),
  update: (taskTypeId: string, data: UpdateTaskTypeInput) =>
    apiClient.patch<ApiResponse<AdminTaskType>>(`/admin/task-types/${taskTypeId}`, data),
  updateStatus: (taskTypeId: string, data: UpdateTaskTypeStatusInput) =>
    apiClient.patch<ApiResponse<AdminTaskType>>(`/admin/task-types/${taskTypeId}/status`, data),
  delete: (taskTypeId: string) =>
    apiClient.delete<ApiResponse<AdminTaskType | null>>(`/admin/task-types/${taskTypeId}`),
}
