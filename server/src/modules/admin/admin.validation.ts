import { z } from "zod"

const roles = ["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"] as const

export const adminUserIdParamsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
})

export const adminCreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100),
  displayName: z.string().min(1).max(100).optional(),
  team: z.string().min(1).max(100).optional(),
  notes: z.string().max(1000).optional(),
  role: z.enum(roles),
  isActive: z.boolean().optional(),
})

export const adminUpdateUserRoleSchema = z.object({
  role: z.enum(roles),
})

export const adminUpdateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1, "Name is required").max(100).optional(),
  displayName: z.string().min(1).max(100).optional(),
  team: z.string().min(1).max(100).optional(),
  notes: z.string().max(1000).optional(),
  role: z.enum(roles).optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required to update",
})

export const adminUpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
})

export const adminBoardMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
})

export const adminTaskTypeIdParamsSchema = z.object({
  taskTypeId: z.string().min(1, "Task type ID is required"),
})

export const adminCreateTaskTypeSchema = z.object({
  name: z.string().min(1, "Task type name is required").max(100),
  description: z.string().min(1, "Task type description is required").max(500),
  baseRate: z.number().int().nonnegative("Base rate must be non-negative"),
})

export const adminUpdateTaskTypeSchema = z.object({
  name: z.string().min(1, "Task type name is required").max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  baseRate: z.number().int().nonnegative().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required to update",
})

export const adminUpdateTaskTypeStatusSchema = z.object({
  isActive: z.boolean(),
})

export const adminUpdateBoardMemberStatusSchema = z.object({
  isActive: z.boolean(),
})

export const adminSetBoardChairSchema = z.object({
  isChair: z.literal(true)
})
