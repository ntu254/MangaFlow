import { AppError } from "../../../shared/errors/AppError.js"
import { recordAuditLog } from "../../../shared/workflow/events.js"
import type { TaskTypeInput, TaskTypeUpdateInput } from "../../task/task-type.types.js"
import * as repository from "../admin.repository.js"

export async function listAdminTaskTypesService() {
  return repository.listTaskTypes()
}

async function assertUniqueTaskTypeIdentity(input: { name?: string; code?: string }, taskTypeId?: string) {
  if (input.name) {
    const existing = await repository.getTaskTypeByName(input.name)
    if (existing && String(existing.id) !== taskTypeId) throw new AppError("Task type with this name already exists", 409)
  }

  if (input.code) {
    const existingCode = await repository.getTaskTypeByCode(input.code)
    if (existingCode && String(existingCode.id) !== taskTypeId) {
      throw new AppError("Task type with this code already exists", 409)
    }
  }
}

export async function createAdminTaskTypeService(input: TaskTypeInput, actorId?: string) {
  await assertUniqueTaskTypeIdentity(input)
  const taskType = await repository.createTaskType(input)
  await recordConfigAudit(actorId, taskType, {
    action: "TASK_TYPE_CREATED",
    changedFields: Object.keys(input),
    to: safeTaskTypeSnapshot(taskType),
  })
  return taskType
}

export async function updateAdminTaskTypeService(taskTypeId: string, updates: TaskTypeUpdateInput, actorId?: string) {
  await assertUniqueTaskTypeIdentity(updates, taskTypeId)

  const existing = await repository.getTaskType(taskTypeId)
  if (!existing) throw new AppError("Task type not found", 404)
  const taskType = await repository.updateTaskType(taskTypeId, updates)
  if (!taskType) throw new AppError("Task type not found", 404)
  const fields = changedFields(existing, updates)
  if (fields.length > 0) {
    await recordConfigAudit(actorId, taskType, {
      action: "TASK_TYPE_UPDATED",
      changedFields: fields,
      from: pickFields(existing, fields),
      to: pickFields(taskType, fields),
    })
  }
  return taskType
}

export async function activateAdminTaskTypeService(taskTypeId: string, actorId?: string) {
  const existing = await repository.getTaskType(taskTypeId)
  if (!existing) throw new AppError("Task type not found", 404)
  const taskType = await repository.updateTaskType(taskTypeId, { isActive: true })
  if (!taskType) throw new AppError("Task type not found", 404)
  await recordConfigAudit(actorId, taskType, {
    action: "TASK_TYPE_STATUS_UPDATED",
    changedFields: ["isActive"],
    from: { isActive: existing.isActive },
    to: { isActive: true },
  })
  return taskType
}

export async function deactivateAdminTaskTypeService(taskTypeId: string, actorId?: string) {
  const existing = await repository.getTaskType(taskTypeId)
  if (!existing) throw new AppError("Task type not found", 404)
  const taskType = await repository.updateTaskType(taskTypeId, { isActive: false })
  if (!taskType) throw new AppError("Task type not found", 404)
  await recordConfigAudit(actorId, taskType, {
    action: "TASK_TYPE_STATUS_UPDATED",
    changedFields: ["isActive"],
    from: { isActive: existing.isActive },
    to: { isActive: false },
  })
  return taskType
}

export async function deleteAdminTaskTypeService(taskTypeId: string, actorId?: string) {
  const taskType = await repository.getTaskType(taskTypeId)
  if (!taskType) throw new AppError("Task type not found", 404)
  if (await repository.taskTypeInUse(taskTypeId)) {
    const updatedTaskType = await repository.updateTaskType(taskTypeId, { isActive: false })
    await recordConfigAudit(actorId, updatedTaskType ?? taskType, {
      action: "TASK_TYPE_DEACTIVATED_INSTEAD_OF_DELETE",
      changedFields: ["isActive"],
      from: { isActive: taskType.isActive },
      to: { isActive: false },
    })
    throw new AppError("Task type is in use and was deactivated instead", 409)
  }
  const deletedTaskType = await repository.deleteTaskType(taskTypeId)
  await recordConfigAudit(actorId, taskType, {
    action: "TASK_TYPE_DELETED",
    deleted: safeTaskTypeSnapshot(taskType),
  })
  return deletedTaskType
}

function toAuditId(document: any) {
  return String(document?._id ?? document?.id)
}

function changedFields(source: any, patch: Record<string, unknown>) {
  return Object.keys(patch).filter((field) => source[field] !== patch[field])
}

function pickFields(source: any, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, source[field]]))
}

function safeTaskTypeSnapshot(taskType: any) {
  return {
    name: taskType.name,
    code: taskType.code,
    baseRate: taskType.baseRate,
    currency: taskType.currency,
    isActive: taskType.isActive,
    allowRegionTask: taskType.allowRegionTask,
    allowPageTask: taskType.allowPageTask,
    requiresFileSubmission: taskType.requiresFileSubmission,
    requiresTextSubmission: taskType.requiresTextSubmission,
    sortOrder: taskType.sortOrder,
  }
}

async function recordConfigAudit(actorId: string | undefined, taskType: any, metadata: Record<string, unknown>) {
  try {
    await recordAuditLog({
      event: "CONFIG_UPDATED",
      actorId,
      entityType: "TaskType",
      entityId: toAuditId(taskType),
      metadata,
    })
  } catch {
    // Admin audit is best-effort in this MVP; business action should not fail on log write.
  }
}
