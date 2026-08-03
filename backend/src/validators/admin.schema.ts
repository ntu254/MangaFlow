import { z } from "zod";

export const createUserSchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    password: z.string().min(8).max(200).optional(),
    role: z.enum(["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]),
    active: z.boolean().optional(),
    isChair: z.boolean().optional(),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    role: z.enum(["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]).optional(),
    active: z.boolean().optional(),
    isChair: z.boolean().optional(),
    reason: z.string().min(8).max(500).optional(),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8).max(200),
  })
  .strict();

export const payrollActionSchema = z
  .object({
    action: z.enum(["confirm", "mark_paid", "void"]),
    reason: z.string().min(1).max(500).optional(),
  })
  .strict();

export const adminNotificationSchema = z
  .object({
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(2000),
    audienceType: z.enum(["USER", "ROLE", "ALL"]).optional(),
    audienceRole: z.enum(["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]).optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
    actionUrl: z.string().max(500).optional(),
    kind: z.string().min(1).max(100).optional(),
    userId: z.string().optional(),
    targetRole: z.enum(["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]).optional(),
    status: z.enum(["DRAFT", "SCHEDULED", "SENT", "ARCHIVED"]).optional(),
    type: z.string().max(100).optional(),
    scheduledAt: z.string().optional(),
  })
  .strict();

export const patchAdminNotificationSchema = adminNotificationSchema.partial().strict();
