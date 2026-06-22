import { Task } from "../task.model.js"
import type { TaskStatus, TaskPriority, TaskCurrency } from "../../../shared/workflow/status.js"

export interface CreateTaskRecordInput {
  seriesId: string
  chapterId: string
  pageId?: string
  regionId?: string
  taskTypeId: string
  assignedTo: string
  assignedBy: string
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  baseRate: number
  currency?: TaskCurrency
  dueDate: Date
  contextPageIds?: string[]
}

export async function createTaskRecord(input: CreateTaskRecordInput): Promise<any> {
  return Task.create({
    seriesId: input.seriesId,
    chapterId: input.chapterId,
    pageId: input.pageId,
    regionId: input.regionId,
    taskTypeId: input.taskTypeId,
    assignedTo: input.assignedTo,
    assignedBy: input.assignedBy,
    title: input.title,
    description: input.description,
    status: input.status || "TODO",
    priority: input.priority || "NORMAL",
    baseRate: input.baseRate,
    currency: input.currency ?? "VND",
    dueDate: input.dueDate,
    contextPageIds: input.contextPageIds || [],
  })
}

export async function getTaskById(taskId: string): Promise<any | null> {
  return Task.findById(taskId).populate("taskTypeId")
}

export async function listTasksBySeries(seriesId: string, filters?: { status?: string; assignedTo?: string }): Promise<any[]> {
  const query: Record<string, unknown> = { seriesId }
  if (filters?.status) query.status = filters.status
  if (filters?.assignedTo) query.assignedTo = filters.assignedTo
  return Task.find(query).sort({ createdAt: -1 }).populate("taskTypeId").lean()
}

export async function listTasksBySeriesIds(seriesIds: string[]): Promise<any[]> {
  return Task.find({ seriesId: { $in: seriesIds } }).sort({ createdAt: -1 }).populate("taskTypeId").lean()
}

export async function listTasksByChapter(chapterId: string, filters?: { assignedTo?: string }): Promise<any[]> {
  const query: Record<string, unknown> = { chapterId }
  if (filters?.assignedTo) query.assignedTo = filters.assignedTo
  return Task.find(query).sort({ createdAt: -1 }).populate("taskTypeId").lean()
}

export async function listTasksByAssignee(assigneeId: string): Promise<any[]> {
  return Task.find({ assignedTo: assigneeId }).sort({ dueDate: 1 }).populate("taskTypeId").lean()
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<any | null> {
  return Task.findByIdAndUpdate(taskId, { status }, { new: true }).populate("taskTypeId")
}

export async function updateTaskPriority(taskId: string, priority: TaskPriority): Promise<any | null> {
  return Task.findByIdAndUpdate(taskId, { priority }, { new: true }).populate("taskTypeId")
}

export async function updateTaskDueDate(taskId: string, dueDate: Date): Promise<any | null> {
  return Task.findByIdAndUpdate(taskId, { dueDate }, { new: true }).populate("taskTypeId")
}
