import type { TaskTypeInput, TaskTypeUpdateInput } from "../task-type.types.js";
export declare function createTaskTypeService(input: TaskTypeInput): Promise<any>;
export declare function listTaskTypesService(activeOnly?: boolean): Promise<any[]>;
export declare function getTaskTypeService(taskTypeId: string): Promise<any>;
export declare function updateTaskTypeService(taskTypeId: string, updates: TaskTypeUpdateInput): Promise<any>;
export declare function deleteTaskTypeService(taskTypeId: string): Promise<any>;
//# sourceMappingURL=task-type.service.d.ts.map