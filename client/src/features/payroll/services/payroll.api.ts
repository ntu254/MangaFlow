import { apiClient } from "@/shared/lib/axios"
import type { ApiResponse } from "@/shared/types"

export type EarningStatus = "PENDING" | "CONFIRMED" | "PAID"

export interface EarningAssistant {
  _id: string
  name: string
  email: string
  role: string
}

export interface EarningTaskType {
  _id: string
  name: string
  code: string
}

export interface EarningTask {
  _id: string
  title: string
  status: string
  taskTypeId?: EarningTaskType | null
}

/**
 * Shape returned by GET /api/payroll/earnings. The server populates the
 * assistant and task (with task type). A reference may fall back to a raw id
 * string if the populated document no longer exists.
 */
export interface PayrollEarning {
  _id: string
  taskId: EarningTask | string
  seriesId: string
  chapterId: string
  assistantId: EarningAssistant | string
  baseRate: number
  deadlineMultiplier: number
  finalPayment: number
  isLate: boolean
  status: EarningStatus
  calculatedAt: string
  confirmedAt?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export const earningAssistant = (e: PayrollEarning): EarningAssistant | null =>
  e.assistantId && typeof e.assistantId === "object" ? e.assistantId : null

export const earningTask = (e: PayrollEarning): EarningTask | null =>
  e.taskId && typeof e.taskId === "object" ? e.taskId : null

export const earningAssistantId = (e: PayrollEarning): string =>
  typeof e.assistantId === "object" ? e.assistantId._id : e.assistantId

export const earningTaskId = (e: PayrollEarning): string =>
  typeof e.taskId === "object" ? e.taskId._id : e.taskId

export const payrollApi = {
  listEarnings: () => apiClient.get<ApiResponse<PayrollEarning[]>>("/payroll/earnings"),

  markPaid: (earningId: string) =>
    apiClient.post<ApiResponse<PayrollEarning>>(`/payroll/earnings/${earningId}/mark-paid`),

  confirmTask: (taskId: string) =>
    apiClient.post<ApiResponse<PayrollEarning>>(`/payroll/tasks/${taskId}/confirm`),
}
