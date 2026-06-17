import { z } from "zod";
export declare const createPublicationSchema: z.ZodObject<{
    chapterId: z.ZodString;
    scheduledFor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    chapterId: string;
    scheduledFor?: string | undefined;
}, {
    chapterId: string;
    scheduledFor?: string | undefined;
}>;
export declare const publicationIdParamsSchema: z.ZodObject<{
    publicationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    publicationId: string;
}, {
    publicationId: string;
}>;
export declare const schedulePublicationBodySchema: z.ZodObject<{
    scheduledFor: z.ZodString;
}, "strip", z.ZodTypeAny, {
    scheduledFor: string;
}, {
    scheduledFor: string;
}>;
export declare const patchPublicationBodySchema: z.ZodObject<{
    scheduledFor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    scheduledFor?: string | undefined;
}, {
    scheduledFor?: string | undefined;
}>;
//# sourceMappingURL=publication.validation.d.ts.map