import { z } from "zod";
export declare const seriesIdParamsSchema: z.ZodObject<{
    seriesId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    seriesId: string;
}, {
    seriesId: string;
}>;
export declare const boardVoteBodySchema: z.ZodObject<{
    value: z.ZodEnum<["APPROVE", "REJECT", "NEEDS_REVISION"]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: "APPROVE" | "REJECT" | "NEEDS_REVISION";
    note?: string | undefined;
}, {
    value: "APPROVE" | "REJECT" | "NEEDS_REVISION";
    note?: string | undefined;
}>;
export declare const boardFinalizeBodySchema: z.ZodEffects<z.ZodObject<{
    decision: z.ZodOptional<z.ZodEnum<["APPROVED", "REJECTED", "NEEDS_REVISION"]>>;
    publicationType: z.ZodOptional<z.ZodEnum<["WEEKLY", "MONTHLY"]>>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    note?: string | undefined;
    publicationType?: "WEEKLY" | "MONTHLY" | undefined;
    decision?: "APPROVED" | "REJECTED" | "NEEDS_REVISION" | undefined;
}, {
    note?: string | undefined;
    publicationType?: "WEEKLY" | "MONTHLY" | undefined;
    decision?: "APPROVED" | "REJECTED" | "NEEDS_REVISION" | undefined;
}>, {
    note?: string | undefined;
    publicationType?: "WEEKLY" | "MONTHLY" | undefined;
    decision?: "APPROVED" | "REJECTED" | "NEEDS_REVISION" | undefined;
}, {
    note?: string | undefined;
    publicationType?: "WEEKLY" | "MONTHLY" | undefined;
    decision?: "APPROVED" | "REJECTED" | "NEEDS_REVISION" | undefined;
}>;
export declare const boardTieBreakBodySchema: z.ZodEffects<z.ZodObject<{
    value: z.ZodEnum<["APPROVE", "REJECT", "NEEDS_REVISION"]>;
    publicationType: z.ZodOptional<z.ZodEnum<["WEEKLY", "MONTHLY"]>>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: "APPROVE" | "REJECT" | "NEEDS_REVISION";
    note?: string | undefined;
    publicationType?: "WEEKLY" | "MONTHLY" | undefined;
}, {
    value: "APPROVE" | "REJECT" | "NEEDS_REVISION";
    note?: string | undefined;
    publicationType?: "WEEKLY" | "MONTHLY" | undefined;
}>, {
    value: "APPROVE" | "REJECT" | "NEEDS_REVISION";
    note?: string | undefined;
    publicationType?: "WEEKLY" | "MONTHLY" | undefined;
}, {
    value: "APPROVE" | "REJECT" | "NEEDS_REVISION";
    note?: string | undefined;
    publicationType?: "WEEKLY" | "MONTHLY" | undefined;
}>;
export declare const atRiskDecisionBodySchema: z.ZodObject<{
    decision: z.ZodEnum<["CONTINUE", "WARNING", "REQUEST_IMPROVEMENT_PLAN", "CANCEL"]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    decision: "WARNING" | "CONTINUE" | "REQUEST_IMPROVEMENT_PLAN" | "CANCEL";
    note?: string | undefined;
}, {
    decision: "WARNING" | "CONTINUE" | "REQUEST_IMPROVEMENT_PLAN" | "CANCEL";
    note?: string | undefined;
}>;
//# sourceMappingURL=board.validation.d.ts.map