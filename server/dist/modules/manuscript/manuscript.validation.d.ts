import { z } from "zod";
export declare const manuscriptIdParamsSchema: z.ZodObject<{
    manuscriptId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    manuscriptId: string;
}, {
    manuscriptId: string;
}>;
export declare const manuscriptReviewBodySchema: z.ZodObject<{
    reviewNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reviewNote?: string | undefined;
}, {
    reviewNote?: string | undefined;
}>;
//# sourceMappingURL=manuscript.validation.d.ts.map