import { AppError } from "../../../shared/errors/AppError.js";
import * as repository from "../admin.repository.js";
export async function listAdminTaskTypesService() {
    return repository.listTaskTypes();
}
async function assertUniqueTaskTypeIdentity(input, taskTypeId) {
    if (input.name) {
        const existing = await repository.getTaskTypeByName(input.name);
        if (existing && String(existing.id) !== taskTypeId)
            throw new AppError("Task type with this name already exists", 409);
    }
    if (input.code) {
        const existingCode = await repository.getTaskTypeByCode(input.code);
        if (existingCode && String(existingCode.id) !== taskTypeId) {
            throw new AppError("Task type with this code already exists", 409);
        }
    }
}
export async function createAdminTaskTypeService(input) {
    await assertUniqueTaskTypeIdentity(input);
    return repository.createTaskType(input);
}
export async function updateAdminTaskTypeService(taskTypeId, updates) {
    await assertUniqueTaskTypeIdentity(updates, taskTypeId);
    const taskType = await repository.updateTaskType(taskTypeId, updates);
    if (!taskType)
        throw new AppError("Task type not found", 404);
    return taskType;
}
export async function activateAdminTaskTypeService(taskTypeId) {
    const taskType = await repository.updateTaskType(taskTypeId, { isActive: true });
    if (!taskType)
        throw new AppError("Task type not found", 404);
    return taskType;
}
export async function deactivateAdminTaskTypeService(taskTypeId) {
    const taskType = await repository.updateTaskType(taskTypeId, { isActive: false });
    if (!taskType)
        throw new AppError("Task type not found", 404);
    return taskType;
}
export async function deleteAdminTaskTypeService(taskTypeId) {
    const taskType = await repository.getTaskType(taskTypeId);
    if (!taskType)
        throw new AppError("Task type not found", 404);
    if (await repository.taskTypeInUse(taskTypeId)) {
        await repository.updateTaskType(taskTypeId, { isActive: false });
        throw new AppError("Task type is in use and was deactivated instead", 409);
    }
    return repository.deleteTaskType(taskTypeId);
}
//# sourceMappingURL=admin-task-type.service.js.map