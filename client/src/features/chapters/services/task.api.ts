import { apiClient } from "@/shared/lib/axios"
import type { ApiResponse } from "@/shared/types"

// ── Types ─────────────────────────────────────────────────────────────────────

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "MANGAKA_APPROVED"
  | "EDITOR_APPROVED"
  | "REVISION_REQUESTED"
  | "REJECTED"
  | "CANCELLED"

export type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT"

export interface Task {
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
  dueDate: string
  contextPageIds: string[]
  /** Flow-05: latest submission for quick resolution. */
  currentSubmissionId?: string
  /** Flow-06/07: which role last requested revision. */
  revisionRequestedByRole?: "MANGAKA" | "EDITOR"
  revisionRequestedByUserId?: string
  revisionRequestedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  seriesId: string
  chapterId: string
  pageId?: string
  regionId?: string
  taskTypeId: string
  assignedTo: string
  title: string
  description?: string
  priority?: TaskPriority
  dueDate: string
  contextPageIds?: string[]
}

// ── Task API ──────────────────────────────────────────────────────────────────

export const taskApi = {
  /**
   * Flow-05: Create a Page-level or Region-level task.
   * Series must be APPROVED/ONGOING/AT_RISK. Assistant must be an active team member.
   * Duplicate guard: blocks if an active task already exists for (pageId/regionId + taskTypeId).
   */
  create: (input: CreateTaskInput) =>
    apiClient.post<ApiResponse<Task>>("/tasks", input),

  get: (taskId: string) =>
    apiClient.get<ApiResponse<Task>>(`/tasks/${taskId}`),

  listBySeries: (seriesId: string) =>
    apiClient.get<ApiResponse<Task[]>>(`/tasks/series/${seriesId}`),

  listByChapter: (chapterId: string) =>
    apiClient.get<ApiResponse<Task[]>>(`/tasks/chapter/${chapterId}`),

  /** Flow-05: Assistant fetches their own assigned tasks. */
  listByAssignee: (assigneeId: string) =>
    apiClient.get<ApiResponse<Task[]>>(`/tasks/assignee/${assigneeId}`),

  /**
   * Flow-05: Assistant starts a task (sets status → IN_PROGRESS).
   * Only the assigned Assistant can call this.
   */
  start: (taskId: string) =>
    apiClient.patch<ApiResponse<Task>>(`/tasks/${taskId}/status`, { status: "IN_PROGRESS" }),

  updatePriority: (taskId: string, priority: TaskPriority) =>
    apiClient.patch<ApiResponse<Task>>(`/tasks/${taskId}/priority`, { priority }),

  updateDueDate: (taskId: string, dueDate: string) =>
    apiClient.patch<ApiResponse<Task>>(`/tasks/${taskId}/due-date`, { dueDate }),
}
