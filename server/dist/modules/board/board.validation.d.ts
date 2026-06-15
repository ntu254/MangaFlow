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
}, "strip", z.ZodTypeAny, {
    value: "APPROVE" | "REJECT" | "NEEDS_REVISION";
}, {
    value: "APPROVE" | "REJECT" | "NEEDS_REVISION";
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