import type { TaskStatus, TaskPriority } from "../../../shared/workflow/status.js";
export interface CreateTaskRecordInput {
    seriesId: string;
    chapterId: string;
    pageId?: string;
    regionId?: string;
    taskTypeId: string;
    assignedTo: string;
    assignedBy: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    baseRate: number;
    dueDate: Date;
    contextPageIds?: string[];
}
export declare function createTaskRecord(input: CreateTaskRecordInput): Promise<any>;
export declare function getTaskById(taskId: string): Promise<any | null>;
export declare function listTasksBySeries(seriesId: string, filters?: {
    status?: string;
    assignedTo?: string;
}): Promise<any[]>;
export declare function listTasksByChapter(chapterId: string): Promise<any[]>;
export declare function listTasksByAssignee(assigneeId: string): Promise<any[]>;
export declare function updateTaskStatus(taskId: string, status: TaskStatus): Promise<any | null>;
export declare function updateTaskPriority(taskId: string, priority: TaskPriority): Promise<any | null>;
export declare function updateTaskDueDate(taskId: string, dueDate: Date): Promise<any | null>;
//# sourceMappingURL=task.repository.d.ts.map