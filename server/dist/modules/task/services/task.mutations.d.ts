import type { TaskPriority, TaskStatus } from "../../../shared/workflow/status.js";
import { type TaskActor } from "./task.access.js";
export interface CreateTaskServiceInput {
    seriesId: string;
    chapterId: string;
    pageId?: string;
    regionId?: string;
    taskTypeId: string;
    assignedTo: string;
    assignedBy: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate: Date;
    contextPageIds?: string[];
}
export declare function createTaskService(input: CreateTaskServiceInput): Promise<import("../mappers/task.mapper.js").CreateTaskResult>;
export declare function updateTaskStatusService(taskId: string, actor: TaskActor, status: TaskStatus): Promise<any>;
export declare function updateTaskPriorityService(taskId: string, actor: TaskActor, priority: TaskPriority): Promise<any>;
export declare function updateTaskDueDateService(taskId: string, actor: TaskActor, dueDate: Date): Promise<any>;
//# sourceMappingURL=task.mutations.d.ts.map