import { AppError } from "../../../shared/errors/AppError.js";
import { createTaskTypeRepository, deleteTaskType, getTaskTypeById, listTaskTypes, updateTaskType } from "../task.repository.js";
export async function createTaskTypeService(input) {
    if (!input.name?.trim())
        throw new AppError("Task type name is required", 400);
    if (!input.code?.trim())
        throw new AppError("Task type code is required", 400);
    if (input.description?.trim() === "")
        throw new AppError("Task type description is required", 400);
    if (typeof input.baseRate !== "number" || input.baseRate < 0)
        throw new AppError("Valid base rate is required", 400);
    return createTaskTypeRepository(input);
}
export async function listTaskTypesService(activeOnly = true) {
    return listTaskTypes(activeOnly);
}
export async function getTaskTypeService(taskTypeId) {
    const taskType = await getTaskTypeById(taskTypeId);
    if (!taskType)
        throw new AppError("Task type not found", 404);
    return taskType;
}
export async function updateTaskTypeService(taskTypeId, updates) {
    const taskType = await updateTaskType(taskTypeId, updates);
    if (!taskType)
        throw new AppError("Task type not found", 404);
    return taskType;
}
export async function deleteTaskTypeService(taskTypeId) {
    return deleteTaskType(taskTypeId);
}
//# sourceMappingURL=task-type.service.js.map