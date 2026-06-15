import { z } from "zod";
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodEnum<["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    role: "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
    password: string;
}, {
    email: string;
    name: string;
    role: "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
    password: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
//# sourceMappingURL=auth.validation.d.ts.map