import { Task, TaskType } from "../task.model.js";
import { AppError } from "../../../shared/errors/AppError.js";
export async function createTaskTypeRepository(input) {
    const existing = await TaskType.findOne({ name: input.name });
    if (existing) {
        throw new AppError("Task type with this name already exists", 409);
    }
    return TaskType.create(input);
}
export async function listTaskTypes(activeOnly = true) {
    const query = activeOnly ? { isActive: true } : {};
    return TaskType.find(query).sort({ name: 1 }).lean();
}
export async function getTaskTypeById(taskTypeId) {
    return TaskType.findById(taskTypeId);
}
export async function updateTaskType(taskTypeId, updates) {
    return TaskType.findByIdAndUpdate(taskTypeId, updates, { new: true });
}
export async function deleteTaskType(taskTypeId) {
    const taskType = await TaskType.findById(taskTypeId);
    if (!taskType)
        return null;
    const inUse = await Task.exists({ taskTypeId });
    if (inUse) {
        // Soft delete (deactivate)
        taskType.isActive = false;
        await taskType.save();
        return { ...taskType.toJSON(), _deactivated: true };
    }
    return TaskType.findByIdAndDelete(taskTypeId);
}
//# sourceMappingURL=task-type.repository.js.map