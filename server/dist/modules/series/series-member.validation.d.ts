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
export type AddSeriesMemberInput = z.infer<typeof addSeriesMemberSchema>;
//# sourceMappingURL=series-member.validation.d.ts.map