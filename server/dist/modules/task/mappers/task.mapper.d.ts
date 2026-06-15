import type { TaskPriority, TaskStatus } from "../../../shared/workflow/status.js";
export interface CreateTaskResult {
    id: string;
    seriesId: string;
    chapterId: string;
    pageId?: string;
    regionId?: string;
    taskTypeId: string;
    assignedTo: string;
    assignedBy: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    baseRate: number;
    dueDate: Date;
    contextPageIds: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare function toCreateTaskResult(task: any): CreateTaskResult;
//# sourceMappingURL=task.mapper.d.ts.map