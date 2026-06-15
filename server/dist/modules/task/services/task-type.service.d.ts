export declare function createTaskTypeService(input: {
    name: string;
    description: string;
    baseRate: number;
}): Promise<any>;
export declare function listTaskTypesService(activeOnly?: boolean): Promise<any[]>;
export declare function getTaskTypeService(taskTypeId: string): Promise<any>;
export declare function updateTaskTypeService(taskTypeId: string, updates: {
    description?: string;
    baseRate?: number;
    isActive?: boolean;
}): Promise<any>;
export declare function deleteTaskTypeService(taskTypeId: string): Promise<any>;
//# sourceMappingURL=task-type.service.d.ts.map