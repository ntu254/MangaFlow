import { apiRequest } from "@/shared/api/client"

export interface TaskTypeRef {
  id?: string
  _id?: string
  name?: string
  baseRate?: number
  description?: string
  isActive?: boolean
}

export interface Task {
  id?: string
  _id?: string
  seriesId: string
  chapterId: string
  pageId?: string
  regionId?: string
  taskTypeId: string | TaskTypeRef
  assignedTo: string
  assignedBy: string
  title: string
  description?: string
  status: string
  priority: string
  baseRate: number
  dueDate: string
  contextPageIds?: string[]
  createdAt: string
  updatedAt: string
}

export function listTasksByAssignee(assigneeId: string) {
  return apiRequest<Task[]>(`/tasks/assignee/${assigneeId}`)
}

export function getTask(taskId: string) {
  return apiRequest<Task>(`/tasks/${taskId}`)
}

export function listTaskTypes(activeOnly = true) {
  return apiRequest<TaskTypeRef[]>(`/tasks/types?activeOnly=${activeOnly ? "true" : "false"}`)
}
