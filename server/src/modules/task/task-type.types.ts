import type { TaskCurrency } from "../../shared/workflow/status.js"

export interface TaskTypeInput {
  name: string
  code: string
  description?: string
  baseRate: number
  currency?: TaskCurrency
  isActive?: boolean
  allowRegionTask?: boolean
  allowPageTask?: boolean
  requiresFileSubmission?: boolean
  requiresTextSubmission?: boolean
  sortOrder?: number
}

export type TaskTypeUpdateInput = Partial<TaskTypeInput>
