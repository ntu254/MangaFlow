import { apiClient } from "@/shared/lib/axios"
import type { ApiResponse } from "@/shared/types"

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
