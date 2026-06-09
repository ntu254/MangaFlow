import { Task, TaskType } from "../task.model.js"
import { AppError } from "../../../shared/errors/AppError.js"

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
