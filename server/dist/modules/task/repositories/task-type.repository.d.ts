export declare function createTaskTypeRepository(input: {
    name: string;
    description: string;
    baseRate: number;
}): Promise<any>;
export declare function listTaskTypes(activeOnly?: boolean): Promise<any[]>;
export declare function getTaskTypeById(taskTypeId: string): Promise<any | null>;
export declare function updateTaskType(taskTypeId: string, updates: {
    description?: string;
    baseRate?: number;
    isActive?: boolean;
}): Promise<any | null>;
export declare function deleteTaskType(taskTypeId: string): Promise<any | null>;
//# sourceMappingURL=task-type.repository.d.ts.map