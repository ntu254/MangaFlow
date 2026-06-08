import { Task, TaskType } from "./task.model.js"
import { User } from "../auth/auth.model.js"
import { Chapter, Page, Region } from "../chapter/chapter.model.js"
import { Series, SeriesMember } from "../series/series.model.js"
import { AppError } from "../../shared/errors/AppError.js"
import type { TaskStatus, TaskPriority } from "../../shared/workflow/status.js"

export interface CreateTaskInput {
  seriesId: string
  chapterId: string
  pageId?: string
  regionId?: string
  taskTypeId: string
  assignedTo: string
  assignedBy: string
  title: string
  description?: string
  priority?: TaskPriority
  dueDate: Date
  contextPageIds?: string[]
}

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
  dueDate: Date
  contextPageIds: string[]
  createdAt: Date
  updatedAt: Date
}

export async function createTaskRepository(input: CreateTaskInput): Promise<CreateTaskResult> {
  const series = await Series.findById(input.seriesId)
  if (!series) {
    throw new AppError("Series not found", 404)
  }

  const allowedStatuses = ["APPROVED", "ONGOING", "AT_RISK"]
  if (!allowedStatuses.includes(series.status as string)) {
    throw new AppError(`Task creation not allowed. Series status is ${series.status}. Must be APPROVED, ONGOING, or AT_RISK.`, 409)
  }

  const chapter = await Chapter.findById(input.chapterId)
  if (!chapter) {
    throw new AppError("Chapter not found", 404)
  }
  if (String(chapter.seriesId) !== input.seriesId) {
    throw new AppError("Chapter does not belong to the specified series", 400)
  }

  const taskType = await TaskType.findById(input.taskTypeId)
  if (!taskType) {
    throw new AppError("Task type not found", 404)
  }
  if (!taskType.isActive) {
    throw new AppError("Task type is not active", 409)
  }

  const assignee = await User.findById(input.assignedTo)
  if (!assignee) {
    throw new AppError("Assigned user not found", 404)
  }
  if (!assignee.isActive) {
    throw new AppError("Assigned user is not active", 403)
  }
  if (assignee.role !== "ASSISTANT") {
    throw new AppError("Assigned user must have system role ASSISTANT", 403)
  }

  const assigneeMember = await SeriesMember.findOne({ seriesId: input.seriesId, userId: input.assignedTo })
  if (!assigneeMember) {
    throw new AppError("Assigned user is not a member of this series", 403)
  }
  if (assigneeMember.role !== "ASSISTANT") {
    throw new AppError("Only Assistants can be assigned tasks", 403)
  }
  if (!assigneeMember.isActive) {
    throw new AppError("Assigned Assistant is not active", 403)
  }
  if (assigneeMember.accessScope !== "TASK_ONLY") {
    throw new AppError("Assigned Assistant must use TASK_ONLY access scope", 403)
  }

  const assignerMember = await SeriesMember.findOne({ seriesId: input.seriesId, userId: input.assignedBy })
  if (!assignerMember) {
    throw new AppError("Assigner is not a member of this series", 403)
  }
  if (!["MANGAKA", "EDITOR"].includes(assignerMember.role)) {
    throw new AppError("Only Mangaka or Editor can assign tasks", 403)
  }
  if (!assignerMember.isActive) {
    throw new AppError("Assigner is not active", 403)
  }

  if (input.pageId) {
    const page = await Page.findById(input.pageId)
    if (!page) {
      throw new AppError("Page not found", 404)
    }
    if (String(page.chapterId) !== input.chapterId) {
      throw new AppError("Page does not belong to the specified chapter", 400)
    }
  }

  if (input.regionId) {
    if (!input.pageId) {
      throw new AppError("Page ID is required when assigning a region task", 400)
    }
    const region = await Region.findById(input.regionId)
    if (!region) {
      throw new AppError("Region not found", 404)
    }
    if (String(region.pageId) !== input.pageId) {
      throw new AppError("Region does not belong to the specified page", 400)
    }
  }

  if (input.contextPageIds && input.contextPageIds.length > 0) {
    const pages = await Page.find({ _id: { $in: input.contextPageIds }, chapterId: input.chapterId })
    if (pages.length !== input.contextPageIds.length) {
      throw new AppError("One or more context pages not found or do not belong to this chapter", 400)
    }
  }

  const task = await Task.create({
    seriesId: input.seriesId,
    chapterId: input.chapterId,
    pageId: input.pageId,
    regionId: input.regionId,
    taskTypeId: input.taskTypeId,
    assignedTo: input.assignedTo,
    assignedBy: input.assignedBy,
    title: input.title,
    description: input.description,
    status: "TODO",
    priority: input.priority || "NORMAL",
    baseRate: taskType.baseRate,
    dueDate: input.dueDate,
    contextPageIds: input.contextPageIds || [],
  })

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
    dueDate: task.dueDate,
    contextPageIds: task.contextPageIds.map(String),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
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

export async function listTasksByChapter(chapterId: string): Promise<any[]> {
  return Task.find({ chapterId }).sort({ createdAt: -1 }).populate("taskTypeId").lean()
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

export async function createTaskTypeRepository(input: { name: string; description: string; baseRate: number }): Promise<any> {
  const existing = await TaskType.findOne({ name: input.name })
  if (existing) {
    throw new AppError("Task type with this name already exists", 409)
  }
  return TaskType.create(input)
}

export async function listTaskTypes(activeOnly = true): Promise<any[]> {
  const query = activeOnly ? { isActive: true } : {}
  return TaskType.find(query).sort({ name: 1 }).lean()
}

export async function getTaskTypeById(taskTypeId: string): Promise<any | null> {
  return TaskType.findById(taskTypeId)
}

export async function updateTaskType(taskTypeId: string, updates: { description?: string; baseRate?: number; isActive?: boolean }): Promise<any | null> {
  return TaskType.findByIdAndUpdate(taskTypeId, updates, { new: true })
}

export async function deleteTaskType(taskTypeId: string): Promise<any | null> {
  const taskType = await TaskType.findById(taskTypeId)
  if (!taskType) return null
  const inUse = await Task.exists({ taskTypeId })
  if (inUse) {
    throw new AppError("Cannot delete task type that is in use by existing tasks", 409)
  }
  return TaskType.findByIdAndDelete(taskTypeId)
}
