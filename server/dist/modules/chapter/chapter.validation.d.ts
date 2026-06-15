import { z } from "zod";
export declare const createChapterSchema: z.ZodObject<{
    body: z.ZodObject<{
        seriesId: z.ZodString;
        chapterNumber: z.ZodNumber;
        title: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        seriesId: string;
        title: string;
        chapterNumber: number;
    }, {
        seriesId: string;
        title: string;
        chapterNumber: number;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        seriesId: string;
        title: string;
        chapterNumber: number;
    };
}, {
    body: {
        seriesId: string;
        title: string;
        chapterNumber: number;
    };
}>;
export declare const chapterIdParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        chapterId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        chapterId: string;
    }, {
        chapterId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        chapterId: string;
    };
}, {
    params: {
        chapterId: string;
    };
}>;
export declare const updateChapterStatusSchema: z.ZodObject<{
    params: z.ZodObject<{
        chapterId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        chapterId: string;
    }, {
        chapterId: string;
    }>;
    body: z.ZodObject<{
        status: z.ZodEnum<["DRAFT", "IN_PRODUCTION", "IN_REVIEW", "READY_FOR_PUBLICATION", "PUBLISHED", "REVISION_REQUIRED"]>;
    }, "strip", z.ZodTypeAny, {
        status: "DRAFT" | "IN_PRODUCTION" | "IN_REVIEW" | "READY_FOR_PUBLICATION" | "PUBLISHED" | "REVISION_REQUIRED";
    }, {
        status: "DRAFT" | "IN_PRODUCTION" | "IN_REVIEW" | "READY_FOR_PUBLICATION" | "PUBLISHED" | "REVISION_REQUIRED";
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: "DRAFT" | "IN_PRODUCTION" | "IN_REVIEW" | "READY_FOR_PUBLICATION" | "PUBLISHED" | "REVISION_REQUIRED";
    };
    params: {
        chapterId: string;
    };
}, {
    body: {
        status: "DRAFT" | "IN_PRODUCTION" | "IN_REVIEW" | "READY_FOR_PUBLICATION" | "PUBLISHED" | "REVISION_REQUIRED";
    };
    params: {
        chapterId: string;
    };
}>;
export declare const createPageSchema: z.ZodObject<{
    params: z.ZodObject<{
        chapterId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        chapterId: string;
    }, {
        chapterId: string;
    }>;
    body: z.ZodObject<{
        pageNumber: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        pageNumber: number;
    }, {
        pageNumber: number;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        pageNumber: number;
    };
    params: {
        chapterId: string;
    };
}, {
    body: {
        pageNumber: number;
    };
    params: {
        chapterId: string;
    };
}>;
export declare const listPagesParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        chapterId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        chapterId: string;
    }, {
        chapterId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        chapterId: string;
    };
}, {
    params: {
        chapterId: string;
    };
}>;
//# sourceMappingURL=chapter.validation.d.ts.map