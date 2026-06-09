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

export interface Comment {
  id?: string
  _id?: string
  taskId: string
  authorId?: { name: string; role: string }
  body: string
  status: string
  createdAt: string
  targetLabel?: string
  isBlocking?: boolean
  isUnresolved?: boolean
}

export interface SubmissionVersion {
  id?: string
  _id?: string
  taskId: string
  submittedBy?: { name: string; role: string }
  version: number
  resultText?: string
  fileAssetId?: { originalName: string }
  status: string
  reviewerNote?: string
  createdAt: string
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

export function getTaskComments(taskId: string) {
  return apiRequest<Comment[]>(`/comments/task/${taskId}`)
}

export function getTaskSubmissions(taskId: string) {
  return apiRequest<SubmissionVersion[]>(`/tasks/${taskId}/submissions`)
}

export function listTasksByChapter(chapterId: string) {
  return apiRequest<Task[]>(`/tasks/chapter/${chapterId}`)
}
