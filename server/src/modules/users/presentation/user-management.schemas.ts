import { z } from "zod";

export const createUserSchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    password: z.string().min(8).max(200).optional(),
    role: z.enum(["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]),
    active: z.boolean().optional(),
    isChair: z.boolean().optional(),
    isEditorInChief: z.boolean().optional(),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    role: z.enum(["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"]).optional(),
    active: z.boolean().optional(),
    isChair: z.boolean().optional(),
    isEditorInChief: z.boolean().optional(),
    reason: z.string().min(8).max(500).optional(),
  })
  .strict();
