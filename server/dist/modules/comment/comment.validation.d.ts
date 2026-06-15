import { z } from "zod";
export declare const createCommentSchema: z.ZodObject<{
    seriesId: z.ZodString;
    chapterId: z.ZodOptional<z.ZodString>;
    pageId: z.ZodOptional<z.ZodString>;
    regionId: z.ZodOptional<z.ZodString>;
    taskId: z.ZodOptional<z.ZodString>;
    submissionId: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    isBlocking: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    body: string;
    seriesId: string;
    chapterId?: string | undefined;
    pageId?: string | undefined;
    regionId?: string | undefined;
    taskId?: string | undefined;
    submissionId?: string | undefined;
    isBlocking?: boolean | undefined;
}, {
    body: string;
    seriesId: string;
    chapterId?: string | undefined;
    pageId?: string | undefined;
    regionId?: string | undefined;
    taskId?: string | undefined;
    submissionId?: string | undefined;
    isBlocking?: boolean | undefined;
}>;
export declare const commentIdParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const taskIdParamsSchema: z.ZodObject<{
    taskId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskId: string;
}, {
    taskId: string;
}>;
//# sourceMappingURL=comment.validation.d.ts.map