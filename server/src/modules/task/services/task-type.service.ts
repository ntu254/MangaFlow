import { AppError } from "../../../shared/errors/AppError.js"
import { createTaskTypeRepository, deleteTaskType, getTaskTypeById, listTaskTypes, updateTaskType } from "../task.repository.js"
import type { TaskTypeInput, TaskTypeUpdateInput } from "../task-type.types.js"

export async function createTaskTypeService(input: TaskTypeInput) {
  if (!input.name?.trim()) throw new AppError("Task type name is required", 400)
  if (!input.code?.trim()) throw new AppError("Task type code is required", 400)
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

export async function updateTaskTypeService(taskTypeId: string, updates: TaskTypeUpdateInput) {
  const taskType = await updateTaskType(taskTypeId, updates)
  if (!taskType) throw new AppError("Task type not found", 404)
  return taskType
}

export async function deleteTaskTypeService(taskTypeId: string) {
  return deleteTaskType(taskTypeId)
}
