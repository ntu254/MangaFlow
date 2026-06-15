import { type TaskActor } from "./task.access.js";
export declare function getTaskService(taskId: string, actor: TaskActor): Promise<any>;
export declare function listTasksBySeriesService(seriesId: string, actor: TaskActor, filters?: {
    status?: string;
    assignedTo?: string;
}): Promise<any[]>;
export declare function listTasksByChapterService(chapterId: string, actor: TaskActor): Promise<any[]>;
export declare function listTasksByAssigneeService(assigneeId: string, actor: TaskActor): Promise<any[]>;
//# sourceMappingURL=task.queries.d.ts.map