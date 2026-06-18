import { apiClient } from "@/shared/lib/axios"
import type { ApiResponse } from "@/shared/types"

// ==================== TASK TYPES ====================
export interface AdminTaskType {
  id: string
  _id?: string
  name: string
  code: string
  description?: string
  baseRate: number
  currency: "POINT" | "VND"
  isActive: boolean
  allowRegionTask: boolean
  allowPageTask: boolean
  requiresFileSubmission: boolean
  requiresTextSubmission: boolean
  sortOrder?: number
  createdAt: string
  updatedAt: string
}

export interface CreateTaskTypeInput {
  name: string
  code: string
  description?: string
  baseRate: number
  currency?: "POINT" | "VND"
  isActive?: boolean
  allowRegionTask?: boolean
  allowPageTask?: boolean
  requiresFileSubmission?: boolean
  requiresTextSubmission?: boolean
  sortOrder?: number
}

export interface UpdateTaskTypeInput {
  name?: string
  code?: string
  description?: string
  baseRate?: number
  currency?: "POINT" | "VND"
  isActive?: boolean
  allowRegionTask?: boolean
  allowPageTask?: boolean
  requiresFileSubmission?: boolean
  requiresTextSubmission?: boolean
  sortOrder?: number
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

export function taskTypeId(taskType: AdminTaskType): string {
  return taskType.id ?? taskType._id ?? ""
}
