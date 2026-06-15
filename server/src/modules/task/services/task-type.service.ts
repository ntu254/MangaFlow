import { AppError } from "../../../shared/errors/AppError.js"
import { createTaskTypeRepository, deleteTaskType, getTaskTypeById, listTaskTypes, updateTaskType } from "../task.repository.js"

export async function createTaskTypeService(input: { name: string; description: string; baseRate: number }) {
  if (!input.name?.trim()) throw new AppError("Task type name is required", 400)
  if (input.description?.trim() === "") throw new AppError("Task type description is required", 400)
  if (typeof input.baseRate !== "number" || input.baseRate < 0) throw new AppError("Valid base rate is required", 400)
  return createTaskTypeRepository(input)
}

export async function listTaskTypesService(activeOnly = true) {
  return listTaskTypes(activeOnly)
}

export async function getTaskTypeService(taskTypeId: string) {
  const taskType = await getTaskTypeById(taskTypeId)
  if (!taskType) throw new AppError("Task type not found", 404)
  return taskType
}

export async function updateTaskTypeService(taskTypeId: string, updates: { description?: string; baseRate?: number; isActive?: boolean }) {
  const taskType = await updateTaskType(taskTypeId, updates)
  if (!taskType) throw new AppError("Task type not found", 404)
  return taskType
}

export async function deleteTaskTypeService(taskTypeId: string) {
  return deleteTaskType(taskTypeId)
}
