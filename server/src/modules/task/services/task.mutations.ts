import { AppError } from "../../../shared/errors/AppError.js"
import { createTaskRecord, getTaskById, updateTaskDueDate, updateTaskPriority, updateTaskStatus } from "../task.repository.js"
import type { TaskPriority, TaskStatus } from "../../../shared/workflow/status.js"
import { assertSeriesManager, type TaskActor } from "./task.access.js"
import { validateTaskCreationScope } from "../guards/task-scope.guard.js"
import { assertTaskAssignmentAllowed } from "../policies/task-assignment.policy.js"
import { toCreateTaskResult } from "../mappers/task.mapper.js"
import { lockTaskTarget, syncFinishedTaskTarget } from "./task-target-state.js"

const REVIEW_OWNED_TASK_STATUSES: TaskStatus[] = [
  "SUBMITTED",
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "REVISION_REQUESTED",
  "REJECTED",
]
const GENERIC_MUTABLE_TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS"]

export interface CreateTaskServiceInput {
  seriesId: string
  chapterId: string
  pageId: string
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

export async function createTaskService(input: CreateTaskServiceInput) {
  if (!input.title?.trim()) throw new AppError("Task title is required", 400)
  if (typeof input.dueDate !== "object" || !(input.dueDate instanceof Date) || isNaN(input.dueDate.getTime())) {
    throw new AppError("Valid due date is required", 400)
  }
  if (input.dueDate < new Date()) throw new AppError("Due date must be in the future", 400)

  const { taskType } = await validateTaskCreationScope({
    seriesId: input.seriesId,
    chapterId: input.chapterId,
    pageId: input.pageId,
    regionId: input.regionId,
    taskTypeId: input.taskTypeId,
    contextPageIds: input.contextPageIds,
  })
  await assertTaskAssignmentAllowed({
    seriesId: input.seriesId,
    assignedTo: input.assignedTo,
    assignedBy: input.assignedBy,
  })

  const task = await createTaskRecord({
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
    baseRate: taskType.baseRate,
    currency: taskType.currency ?? "VND",
    dueDate: input.dueDate,
    contextPageIds: input.contextPageIds,
  })

  await lockTaskTarget(input)

  return toCreateTaskResult(task)
}

async function loadManagedTask(taskId: string, actor: TaskActor) {
  const existing = await getTaskById(taskId)
  if (!existing) throw new AppError("Task not found", 404)

  await assertSeriesManager(String(existing.seriesId), actor)
  return existing
}

export async function updateTaskStatusService(taskId: string, actor: TaskActor, status: TaskStatus) {
  const existing = await getTaskById(taskId)
  if (!existing) throw new AppError("Task not found", 404)

  if (actor.role === "ASSISTANT") {
    if (String(existing.assignedTo) !== actor.userId) {
      throw new AppError("Task access denied", 403)
    }
  } else {
    await assertSeriesManager(String(existing.seriesId), actor)
  }

  if (!GENERIC_MUTABLE_TASK_STATUSES.includes(existing.status as TaskStatus)) {
    throw new AppError(
      "Only TODO or IN_PROGRESS tasks can be changed through the generic task endpoint",
      409,
    )
  }

  if (actor.role === "ASSISTANT") {
    if (status !== "IN_PROGRESS" && status !== "TODO") {
      throw new AppError("Only active Mangaka or Editor series members can manage tasks", 403)
    }
  } else {
    if (REVIEW_OWNED_TASK_STATUSES.includes(status)) {
      throw new AppError(
        "Submission review statuses cannot be changed through the generic task endpoint",
        409,
      )
    }
  }

  const task = await updateTaskStatus(taskId, status)
  if (!task) throw new AppError("Task not found", 404)
  if (status === "CANCELLED") await syncFinishedTaskTarget(existing)
  return task
}

export async function updateTaskPriorityService(taskId: string, actor: TaskActor, priority: TaskPriority) {
  await loadManagedTask(taskId, actor)
  const task = await updateTaskPriority(taskId, priority)
  if (!task) throw new AppError("Task not found", 404)
  return task
}

export async function updateTaskDueDateService(taskId: string, actor: TaskActor, dueDate: Date) {
  if (!(dueDate instanceof Date) || isNaN(dueDate.getTime())) throw new AppError("Valid due date is required", 400)
  await loadManagedTask(taskId, actor)
  const task = await updateTaskDueDate(taskId, dueDate)
  if (!task) throw new AppError("Task not found", 404)
  return task
}
