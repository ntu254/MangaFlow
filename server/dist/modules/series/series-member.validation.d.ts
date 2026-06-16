import { z } from "zod";
export declare const addSeriesMemberSchema: z.ZodObject<{
    userId: z.ZodEffects<z.ZodString, string, string>;
    role: z.ZodEnum<["ASSISTANT", "CO_MANGAKA", "EDITOR"]>;
    accessScope: z.ZodEnum<["FULL", "TASK_ONLY"]>;
}, "strip", z.ZodTypeAny, {
    role: "ASSISTANT" | "EDITOR" | "CO_MANGAKA";
    userId: string;
    accessScope: "FULL" | "TASK_ONLY";
}, {
    role: "ASSISTANT" | "EDITOR" | "CO_MANGAKA";
    userId: string;
    accessScope: "FULL" | "TASK_ONLY";
}>;
export declare const updateSeriesMemberSchema: z.ZodObject<{
    params: z.ZodObject<{
        seriesId: z.ZodEffects<z.ZodString, string, string>;
        memberId: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        seriesId: string;
        memberId: string;
    }, {
        seriesId: string;
        memberId: string;
    }>;
    body: z.ZodObject<{
        /** Flow-03: pause or reactivate a member */
        status: z.ZodEnum<["ACTIVE", "PAUSED"]>;
    }, "strip", z.ZodTypeAny, {
        status: "ACTIVE" | "PAUSED";
    }, {
        status: "ACTIVE" | "PAUSED";
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: "ACTIVE" | "PAUSED";
    };
    params: {
        seriesId: string;
        memberId: string;
    };
}, {
    body: {
        status: "ACTIVE" | "PAUSED";
    };
    params: {
        seriesId: string;
        memberId: string;
    };
}>;
export declare const memberIdParamsSchema: z.ZodObject<{
    seriesId: z.ZodEffects<z.ZodString, string, string>;
    memberId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    seriesId: string;
    memberId: string;
}, {
    seriesId: string;
    memberId: string;
}>;
export type AddSeriesMemberInput = z.infer<typeof addSeriesMemberSchema>;
export type UpdateSeriesMemberInput = z.infer<typeof updateSeriesMemberSchema>;
//# sourceMappingURL=series-member.validation.d.ts.map