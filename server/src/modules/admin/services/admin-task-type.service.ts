import { AppError } from "../../../shared/errors/AppError.js"
import * as repository from "../admin.repository.js"

export async function listAdminTaskTypesService() {
  return repository.listTaskTypes()
}

export async function createAdminTaskTypeService(input: { name: string; description: string; baseRate: number }) {
  const existing = await repository.getTaskTypeByName(input.name)
  if (existing) throw new AppError("Task type with this name already exists", 409)
  return repository.createTaskType(input)
}

export async function updateAdminTaskTypeService(taskTypeId: string, updates: { description?: string; baseRate?: number }) {
  const taskType = await repository.updateTaskType(taskTypeId, updates)
  if (!taskType) throw new AppError("Task type not found", 404)
  return taskType
}

export async function activateAdminTaskTypeService(taskTypeId: string) {
  const taskType = await repository.updateTaskType(taskTypeId, { isActive: true })
  if (!taskType) throw new AppError("Task type not found", 404)
  return taskType
}

export async function deactivateAdminTaskTypeService(taskTypeId: string) {
  const taskType = await repository.updateTaskType(taskTypeId, { isActive: false })
  if (!taskType) throw new AppError("Task type not found", 404)
  return taskType
}

export async function deleteAdminTaskTypeService(taskTypeId: string) {
  const taskType = await repository.getTaskType(taskTypeId)
  if (!taskType) throw new AppError("Task type not found", 404)
  if (await repository.taskTypeInUse(taskTypeId)) {
    await repository.updateTaskType(taskTypeId, { isActive: false })
    throw new AppError("Task type is in use and was deactivated instead", 409)
  }
  return repository.deleteTaskType(taskTypeId)
}
