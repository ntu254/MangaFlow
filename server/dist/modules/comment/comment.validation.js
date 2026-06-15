import { z } from "zod";
export const createCommentSchema = z.object({
    seriesId: z.string().min(1, "Series id is required"),
    chapterId: z.string().min(1).optional(),
    pageId: z.string().min(1).optional(),
    regionId: z.string().min(1).optional(),
    taskId: z.string().min(1).optional(),
    submissionId: z.string().min(1).optional(),
    body: z.string().trim().min(1, "Comment body is required").max(2000),
    isBlocking: z.boolean().optional(),
});
export const commentIdParamsSchema = z.object({
    id: z.string().min(1, "Comment id is required"),
});
export const taskIdParamsSchema = z.object({
    taskId: z.string().min(1, "Task id is required"),
});
//# sourceMappingURL=comment.validation.js.map