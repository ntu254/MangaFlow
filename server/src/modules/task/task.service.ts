import { AppError } from "../../shared/errors/AppError.js"
import { createTaskRepository, getTaskById, listTasksBySeries, listTasksByChapter, listTasksByAssignee, updateTaskStatus, updateTaskPriority, updateTaskDueDate, createTaskTypeRepository, listTaskTypes, getTaskTypeById, updateTaskType, deleteTaskType } from "./task.repository.js"
import type { TaskStatus, TaskPriority } from "../../shared/workflow/status.js"
import type { UserRole } from "../auth/auth.types.js"
import { Chapter } from "../chapter/chapter.model.js"
import { SeriesMember } from "../series/series.model.js"

interface TaskActor {
  userId: string
  role: UserRole
}

export interface CreateTaskServiceInput {
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

export interface CreateTaskServiceResult {
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

export async function createTaskService(input: CreateTaskServiceInput): Promise<CreateTaskServiceResult> {
  // Basic validation
  if (!input.title?.trim()) {
    throw new AppError("Task title is required", 400)
  }

  if (typeof input.dueDate !== "object" || !(input.dueDate instanceof Date) || isNaN(input.dueDate.getTime())) {
    throw new AppError("Valid due date is required", 400)
  }

  if (input.dueDate < new Date()) {
    throw new AppError("Due date must be in the future", 400)
  }

  // Delegate to repository for detailed validation and creation
  return await createTaskRepository({
    seriesId: input.seriesId,
    chapterId: input.chapterId,
    pageId: input.pageId,
    regionId: input.regionId,
    taskTypeId: input.taskTypeId,
    assignedTo: input.assignedTo,
    assignedBy: input.assignedBy,
    title: input.title,
    description: input.description,
    priority: input.priority,
    dueDate: input.dueDate,
    contextPageIds: input.contextPageIds,
  })
}

async function assertSeriesManager(seriesId: string, actor: TaskActor): Promise<void> {
  const member = await SeriesMember.findOne({ seriesId, userId: actor.userId })
  if (!member || !member.isActive || !["MANGAKA", "EDITOR"].includes(member.role)) {
    throw new AppError("Only active Mangaka or Editor series members can manage tasks", 403)
  }
}

async function assertSeriesTaskAccess(seriesId: string, actor: TaskActor, assignedTo?: unknown): Promise<void> {
  if (assignedTo && String(assignedTo) === actor.userId) {
    return
  }

  const member = await SeriesMember.findOne({ seriesId, userId: actor.userId })
  if (!member || !member.isActive) {
    throw new AppError("Task access denied", 403)
  }

  if (["MANGAKA", "EDITOR"].includes(member.role)) {
    return
  }

  if (member.role === "ASSISTANT" && member.accessScope === "TASK_ONLY") {
    throw new AppError("Assistant access is limited to assigned tasks", 403)
  }

  throw new AppError("Task access denied", 403)
}

export async function getTaskService(taskId: string, actor: TaskActor) {
  const task = await getTaskById(taskId)
  if (!task) {
    throw new AppError("Task not found", 404)
  }
  await assertSeriesTaskAccess(String(task.seriesId), actor, task.assignedTo)
  return task
}

export async function listTasksBySeriesService(seriesId: string, actor: TaskActor, filters?: { status?: string; assignedTo?: string }) {
  const member = await SeriesMember.findOne({ seriesId, userId: actor.userId })
  if (!member || !member.isActive) {
    throw new AppError("Task access denied", 403)
  }
  if (member.role === "ASSISTANT") {
    return await listTasksBySeries(seriesId, { ...filters, assignedTo: actor.userId })
  }
  if (!["MANGAKA", "EDITOR"].includes(member.role)) {
    throw new AppError("Task access denied", 403)
  }
  return await listTasksBySeries(seriesId, filters)
}

export async function listTasksByChapterService(chapterId: string, actor: TaskActor) {
  const chapter = await Chapter.findById(chapterId)
  if (!chapter) {
    throw new AppError("Chapter not found", 404)
  }
  const seriesId = String(chapter.seriesId)
  const member = await SeriesMember.findOne({ seriesId, userId: actor.userId })
  if (!member || !member.isActive) {
    throw new AppError("Task access denied", 403)
  }
  if (member.role === "ASSISTANT") {
    return (await listTasksByChapter(chapterId)).filter((task) => String(task.assignedTo) === actor.userId)
  }
  if (!["MANGAKA", "EDITOR"].includes(member.role)) {
    throw new AppError("Task access denied", 403)
  }
  return await listTasksByChapter(chapterId)
}

export async function listTasksByAssigneeService(assigneeId: string, actor: TaskActor) {
  if (assigneeId !== actor.userId && actor.role !== "ADMIN") {
    throw new AppError("Task access denied", 403)
  }
  return await listTasksByAssignee(assigneeId)
}

export async function updateTaskStatusService(taskId: string, actor: TaskActor, status: TaskStatus) {
  const existing = await getTaskById(taskId)
  if (!existing) {
    throw new AppError("Task not found", 404)
  }
  await assertSeriesManager(String(existing.seriesId), actor)
  const task = await updateTaskStatus(taskId, status)
  if (!task) {
    throw new AppError("Task not found", 404)
  }
  return task
}

export async function updateTaskPriorityService(taskId: string, actor: TaskActor, priority: TaskPriority) {
  const existing = await getTaskById(taskId)
  if (!existing) {
    throw new AppError("Task not found", 404)
  }
  await assertSeriesManager(String(existing.seriesId), actor)
  const task = await updateTaskPriority(taskId, priority)
  if (!task) {
    throw new AppError("Task not found", 404)
  }
  return task
}

export async function updateTaskDueDateService(taskId: string, actor: TaskActor, dueDate: Date) {
  if (!(dueDate instanceof Date) || isNaN(dueDate.getTime())) {
    throw new AppError("Valid due date is required", 400)
  }
  const existing = await getTaskById(taskId)
  if (!existing) {
    throw new AppError("Task not found", 404)
  }
  await assertSeriesManager(String(existing.seriesId), actor)
  const task = await updateTaskDueDate(taskId, dueDate)
  if (!task) {
    throw new AppError("Task not found", 404)
  }
  return task
}

export async function createTaskTypeService(input: { name: string; description: string; baseRate: number }) {
  if (!input.name?.trim()) {
    throw new AppError("Task type name is required", 400)
  }
  if (input.description?.trim() === "") {
    throw new AppError("Task type description is required", 400)
  }
  if (typeof input.baseRate !== "number" || input.baseRate < 0) {
    throw new AppError("Valid base rate is required", 400)
  }
  return await createTaskTypeRepository(input)
}

export async function listTaskTypesService(activeOnly = true) {
  return await listTaskTypes(activeOnly)
}

export async function getTaskTypeService(taskTypeId: string) {
  const taskType = await getTaskTypeById(taskTypeId)
  if (!taskType) {
    throw new AppError("Task type not found", 404)
  }
  return taskType
}

export async function updateTaskTypeService(taskTypeId: string, updates: { description?: string; baseRate?: number; isActive?: boolean }) {
  const taskType = await updateTaskType(taskTypeId, updates)
  if (!taskType) {
    throw new AppError("Task type not found", 404)
  }
  return taskType
}

export async function deleteTaskTypeService(taskTypeId: string) {
  return await deleteTaskType(taskTypeId)
}
