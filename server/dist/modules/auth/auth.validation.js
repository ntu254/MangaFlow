import { z } from "zod";
export const createUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(1, "Name is required").max(100),
    role: z.enum(["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]),
});
export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
});
//# sourceMappingURL=auth.validation.js.map