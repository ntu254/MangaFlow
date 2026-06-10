import { apiRequest } from "@/shared/api/client"

export interface PayrollEarning {
  id?: string
  _id?: string
  taskId: string
  seriesId: string
  chapterId: string
  assistantId: string
  baseRate: number
  deadlineMultiplier: number
  finalPayment: number
  status: string
  isLate?: boolean
  calculatedAt?: string
  createdAt?: string
}

export function listPayrollEarnings() {
  return apiRequest<PayrollEarning[]>("/payroll/earnings")
}