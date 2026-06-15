import { z } from "zod";
export declare const createTaskSchema: z.ZodObject<{
    seriesId: z.ZodString;
    chapterId: z.ZodString;
    pageId: z.ZodOptional<z.ZodString>;
    regionId: z.ZodOptional<z.ZodString>;
    taskTypeId: z.ZodString;
    assignedTo: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
    dueDate: z.ZodEffects<z.ZodString, string, string>;
    contextPageIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    seriesId: string;
    title: string;
    chapterId: string;
    taskTypeId: string;
    assignedTo: string;
    dueDate: string;
    description?: string | undefined;
    pageId?: string | undefined;
    regionId?: string | undefined;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | undefined;
    contextPageIds?: string[] | undefined;
}, {
    seriesId: string;
    title: string;
    chapterId: string;
    taskTypeId: string;
    assignedTo: string;
    dueDate: string;
    description?: string | undefined;
    pageId?: string | undefined;
    regionId?: string | undefined;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | undefined;
    contextPageIds?: string[] | undefined;
}>;
export declare const taskIdParamsSchema: z.ZodObject<{
    taskId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskId: string;
}, {
    taskId: string;
}>;
export declare const seriesIdParamsSchema: z.ZodObject<{
    seriesId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    seriesId: string;
}, {
    seriesId: string;
}>;
export declare const chapterIdParamsSchema: z.ZodObject<{
    chapterId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    chapterId: string;
}, {
    chapterId: string;
}>;
export declare const assigneeIdParamsSchema: z.ZodObject<{
    assigneeId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    assigneeId: string;
}, {
    assigneeId: string;
}>;
export declare const updateTaskStatusBodySchema: z.ZodObject<{
    status: z.ZodEnum<["TODO", "IN_PROGRESS", "SUBMITTED", "MANGAKA_APPROVED", "EDITOR_APPROVED", "REVISION_REQUESTED", "REJECTED"]>;
}, "strip", z.ZodTypeAny, {
    status: "REVISION_REQUESTED" | "REJECTED" | "SUBMITTED" | "IN_PROGRESS" | "TODO" | "MANGAKA_APPROVED" | "EDITOR_APPROVED";
}, {
    status: "REVISION_REQUESTED" | "REJECTED" | "SUBMITTED" | "IN_PROGRESS" | "TODO" | "MANGAKA_APPROVED" | "EDITOR_APPROVED";
}>;
export declare const updateTaskPriorityBodySchema: z.ZodObject<{
    priority: z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>;
}, "strip", z.ZodTypeAny, {
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}, {
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}>;
export declare const updateTaskDueDateBodySchema: z.ZodObject<{
    dueDate: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    dueDate: string;
}, {
    dueDate: string;
}>;
export declare const createTaskTypeSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    baseRate: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    baseRate: number;
}, {
    name: string;
    description: string;
    baseRate: number;
}>;
export declare const listTaskTypesSchema: z.ZodObject<{
    activeOnly: z.ZodOptional<z.ZodEnum<["true", "false"]>>;
}, "strip", z.ZodTypeAny, {
    activeOnly?: "false" | "true" | undefined;
}, {
    activeOnly?: "false" | "true" | undefined;
}>;
export declare const taskTypeIdParamsSchema: z.ZodObject<{
    taskTypeId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskTypeId: string;
}, {
    taskTypeId: string;
}>;
export declare const updateTaskTypeBodySchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    baseRate: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    description?: string | undefined;
    baseRate?: number | undefined;
}, {
    isActive?: boolean | undefined;
    description?: string | undefined;
    baseRate?: number | undefined;
}>;
//# sourceMappingURL=task.validation.d.ts.map