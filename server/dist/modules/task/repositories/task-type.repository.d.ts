import type { TaskTypeInput, TaskTypeUpdateInput } from "../task-type.types.js";
export declare function createTaskTypeRepository(input: TaskTypeInput): Promise<any>;
export declare function listTaskTypes(activeOnly?: boolean): Promise<any[]>;
export declare function getTaskTypeById(taskTypeId: string): Promise<any | null>;
export declare function updateTaskType(taskTypeId: string, updates: TaskTypeUpdateInput): Promise<any | null>;
export declare function deleteTaskType(taskTypeId: string): Promise<any | null>;
//# sourceMappingURL=task-type.repository.d.ts.map