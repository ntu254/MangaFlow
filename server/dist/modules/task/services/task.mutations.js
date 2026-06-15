import { AppError } from "../../../shared/errors/AppError.js";
import { createTaskRecord, getTaskById, updateTaskDueDate, updateTaskPriority, updateTaskStatus } from "../task.repository.js";
import { assertSeriesManager } from "./task.access.js";
import { validateTaskCreationScope } from "../guards/task-scope.guard.js";
import { assertTaskAssignmentAllowed } from "../policies/task-assignment.policy.js";
import { toCreateTaskResult } from "../mappers/task.mapper.js";
export async function createTaskService(input) {
    if (!input.title?.trim())
        throw new AppError("Task title is required", 400);
    if (typeof input.dueDate !== "object" || !(input.dueDate instanceof Date) || isNaN(input.dueDate.getTime())) {
        throw new AppError("Valid due date is required", 400);
    }
    if (input.dueDate < new Date())
        throw new AppError("Due date must be in the future", 400);
    const { taskType } = await validateTaskCreationScope({
        seriesId: input.seriesId,
        chapterId: input.chapterId,
        pageId: input.pageId,
        regionId: input.regionId,
        taskTypeId: input.taskTypeId,
        contextPageIds: input.contextPageIds,
    });
    await assertTaskAssignmentAllowed({
        seriesId: input.seriesId,
        assignedTo: input.assignedTo,
        assignedBy: input.assignedBy,
    });
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
        dueDate: input.dueDate,
        contextPageIds: input.contextPageIds,
    });
    return toCreateTaskResult(task);
}
async function loadManagedTask(taskId, actor) {
    const existing = await getTaskById(taskId);
    if (!existing)
        throw new AppError("Task not found", 404);
    await assertSeriesManager(String(existing.seriesId), actor);
    return existing;
}
export async function updateTaskStatusService(taskId, actor, status) {
    const existing = await getTaskById(taskId);
    if (!existing)
        throw new AppError("Task not found", 404);
    if (actor.role === "ASSISTANT") {
        if (String(existing.assignedTo) !== actor.userId) {
            throw new AppError("Task access denied", 403);
        }
        if (status !== "IN_PROGRESS" && status !== "TODO") {
            throw new AppError("Only active Mangaka or Editor series members can manage tasks", 403);
        }
    }
    else {
        await assertSeriesManager(String(existing.seriesId), actor);
    }
    const task = await updateTaskStatus(taskId, status);
    if (!task)
        throw new AppError("Task not found", 404);
    return task;
}
export async function updateTaskPriorityService(taskId, actor, priority) {
    await loadManagedTask(taskId, actor);
    const task = await updateTaskPriority(taskId, priority);
    if (!task)
        throw new AppError("Task not found", 404);
    return task;
}
export async function updateTaskDueDateService(taskId, actor, dueDate) {
    if (!(dueDate instanceof Date) || isNaN(dueDate.getTime()))
        throw new AppError("Valid due date is required", 400);
    await loadManagedTask(taskId, actor);
    const task = await updateTaskDueDate(taskId, dueDate);
    if (!task)
        throw new AppError("Task not found", 404);
    return task;
}
//# sourceMappingURL=task.mutations.js.map