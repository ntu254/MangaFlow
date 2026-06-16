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
    revisionReason: z.ZodOptional<z.ZodString>;
    feedbackSummary: z.ZodOptional<z.ZodString>;
    rejectReason: z.ZodOptional<z.ZodString>;
    editorRecommendation: z.ZodOptional<z.ZodString>;
    feasibilityNote: z.ZodOptional<z.ZodString>;
    suggestedPublicationType: z.ZodOptional<z.ZodEnum<["WEEKLY", "MONTHLY"]>>;
    riskNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reviewNote?: string | undefined;
    editorRecommendation?: string | undefined;
    feasibilityNote?: string | undefined;
    suggestedPublicationType?: "WEEKLY" | "MONTHLY" | undefined;
    riskNote?: string | undefined;
    revisionReason?: string | undefined;
    feedbackSummary?: string | undefined;
    rejectReason?: string | undefined;
}, {
    reviewNote?: string | undefined;
    editorRecommendation?: string | undefined;
    feasibilityNote?: string | undefined;
    suggestedPublicationType?: "WEEKLY" | "MONTHLY" | undefined;
    riskNote?: string | undefined;
    revisionReason?: string | undefined;
    feedbackSummary?: string | undefined;
    rejectReason?: string | undefined;
}>;
//# sourceMappingURL=manuscript.validation.d.ts.map