import { z } from "zod";
export declare const adminUserIdParamsSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export declare const adminCreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    team: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    role: "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
    password: string;
    displayName?: string | undefined;
    team?: string | undefined;
    notes?: string | undefined;
    isActive?: boolean | undefined;
}, {
    email: string;
    name: string;
    role: "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
    password: string;
    displayName?: string | undefined;
    team?: string | undefined;
    notes?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const adminUpdateUserRoleSchema: z.ZodObject<{
    role: z.ZodEnum<["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]>;
}, "strip", z.ZodTypeAny, {
    role: "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
}, {
    role: "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
}>;
export declare const adminUpdateUserSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodString>;
    team: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    name?: string | undefined;
    displayName?: string | undefined;
    team?: string | undefined;
    notes?: string | undefined;
    role?: "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD" | undefined;
    isActive?: boolean | undefined;
}, {
    email?: string | undefined;
    name?: string | undefined;
    displayName?: string | undefined;
    team?: string | undefined;
    notes?: string | undefined;
    role?: "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD" | undefined;
    isActive?: boolean | undefined;
}>, {
    email?: string | undefined;
    name?: string | undefined;
    displayName?: string | undefined;
    team?: string | undefined;
    notes?: string | undefined;
    role?: "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD" | undefined;
    isActive?: boolean | undefined;
}, {
    email?: string | undefined;
    name?: string | undefined;
    displayName?: string | undefined;
    team?: string | undefined;
    notes?: string | undefined;
    role?: "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD" | undefined;
    isActive?: boolean | undefined;
}>;
export declare const adminUpdateUserStatusSchema: z.ZodObject<{
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
}, {
    isActive: boolean;
}>;
export declare const adminBoardMemberSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export declare const adminTaskTypeIdParamsSchema: z.ZodObject<{
    taskTypeId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskTypeId: string;
}, {
    taskTypeId: string;
}>;
export declare const adminCreateTaskTypeSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    baseRate: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    baseRate: number;
}, {
    name: string;
    description: string;
    baseRate: number;
}>;
export declare const adminUpdateTaskTypeSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    baseRate: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    baseRate?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    baseRate?: number | undefined;
}>, {
    name?: string | undefined;
    description?: string | undefined;
    baseRate?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    baseRate?: number | undefined;
}>;
export declare const adminUpdateTaskTypeStatusSchema: z.ZodObject<{
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
}, {
    isActive: boolean;
}>;
export declare const adminUpdateBoardMemberStatusSchema: z.ZodObject<{
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
}, {
    isActive: boolean;
}>;
export declare const adminSetBoardChairSchema: z.ZodObject<{
    isChair: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    isChair: true;
}, {
    isChair: true;
}>;
//# sourceMappingURL=admin.validation.d.ts.map