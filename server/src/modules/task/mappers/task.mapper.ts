import type { TaskCurrency, TaskPriority, TaskStatus } from "../../../shared/workflow/status.js"

export interface CreateTaskResult {
  id: string
  seriesId: string
  chapterId: string
  pageId?: string
  regionId?: string
  taskTypeId: string
  assignedTo: string
  assignedBy: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  baseRate: number
  currency: TaskCurrency
  dueDate: Date
  contextPageIds: string[]
  createdAt: Date
  updatedAt: Date
}

export function toCreateTaskResult(task: any): CreateTaskResult {
  return {
    id: task.id,
    seriesId: String(task.seriesId),
    chapterId: String(task.chapterId),
    pageId: task.pageId ? String(task.pageId) : undefined,
    regionId: task.regionId ? String(task.regionId) : undefined,
    taskTypeId: String(task.taskTypeId),
    assignedTo: String(task.assignedTo),
    assignedBy: String(task.assignedBy),
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    baseRate: task.baseRate,
    currency: (task.currency ?? "VND") as TaskCurrency,
    dueDate: task.dueDate,
    contextPageIds: task.contextPageIds.map(String),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}
