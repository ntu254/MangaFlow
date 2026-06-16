import type { TaskTypeInput, TaskTypeUpdateInput } from "../../task/task-type.types.js";
export declare function listAdminTaskTypesService(): Promise<(import("mongoose").FlattenMaps<import("../../task/task.model.js").TaskTypeDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare function createAdminTaskTypeService(input: TaskTypeInput): Promise<import("mongoose").Document<unknown, {}, import("../../task/task.model.js").TaskTypeDocument, {}, {}> & import("../../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function updateAdminTaskTypeService(taskTypeId: string, updates: TaskTypeUpdateInput): Promise<import("mongoose").Document<unknown, {}, import("../../task/task.model.js").TaskTypeDocument, {}, {}> & import("../../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function activateAdminTaskTypeService(taskTypeId: string): Promise<import("mongoose").Document<unknown, {}, import("../../task/task.model.js").TaskTypeDocument, {}, {}> & import("../../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function deactivateAdminTaskTypeService(taskTypeId: string): Promise<import("mongoose").Document<unknown, {}, import("../../task/task.model.js").TaskTypeDocument, {}, {}> & import("../../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function deleteAdminTaskTypeService(taskTypeId: string): Promise<(import("mongoose").Document<unknown, {}, import("../../task/task.model.js").TaskTypeDocument, {}, {}> & import("../../task/task.model.js").TaskTypeDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
//# sourceMappingURL=admin-task-type.service.d.ts.map