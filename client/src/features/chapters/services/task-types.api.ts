import { apiClient } from "@/shared/lib/axios"
import type { ApiResponse } from "@/shared/types"

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
