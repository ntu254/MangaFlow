import { z } from "zod";
export const createChapterSchema = z.object({
    body: z.object({
        seriesId: z.string().min(1, "Series ID is required"),
        chapterNumber: z.number().int().positive("Chapter number must be positive"),
        title: z.string().min(1, "Title is required").max(200, "Title too long"),
    }),
});
export const chapterIdParamsSchema = z.object({
    params: z.object({
        chapterId: z.string().min(1, "Chapter ID is required"),
    }),
});
export const updateChapterStatusSchema = z.object({
    params: z.object({
        chapterId: z.string().min(1, "Chapter ID is required"),
    }),
    body: z.object({
        status: z.enum([
            "DRAFT",
            "IN_PRODUCTION",
            "IN_REVIEW",
            "READY_FOR_PUBLICATION",
            "PUBLISHED",
            "REVISION_REQUIRED",
        ]),
    }),
});
export const createPageSchema = z.object({
    params: z.object({
        chapterId: z.string().min(1, "Chapter ID is required"),
    }),
    body: z.object({
        pageNumber: z.number().int().positive("Page number must be positive"),
    }),
});
export const listPagesParamsSchema = z.object({
    params: z.object({
        chapterId: z.string().min(1, "Chapter ID is required"),
    }),
});
//# sourceMappingURL=chapter.validation.js.map