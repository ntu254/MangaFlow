import { z } from "zod"
import { TASK_PRIORITIES, TASK_STATUSES } from "../../shared/workflow/status.js"

export const createTaskSchema = z.object({
  seriesId: z.string().min(1, "Series ID is required"),
  chapterId: z.string().min(1, "Chapter ID is required"),
  pageId: z.string().optional(),
  regionId: z.string().optional(),
  taskTypeId: z.string().min(1, "Task type ID is required"),
  assignedTo: z.string().min(1, "Assigned to user ID is required"),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().datetime({ offset: true }).refine((date) => new Date(date) > new Date(), {
    message: "Due date must be in the future",
  }),
  contextPageIds: z.array(z.string()).optional(),
}).refine((input) => Boolean(input.pageId), {
  message: "Task must target a page or a region on a page",
  path: ["pageId"],
})

export const taskIdParamsSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
})

export const seriesIdParamsSchema = z.object({
  seriesId: z.string().min(1, "Series ID is required"),
})

export const chapterIdParamsSchema = z.object({
  chapterId: z.string().min(1, "Chapter ID is required"),
})

export const assigneeIdParamsSchema = z.object({
  assigneeId: z.string().min(1, "Assignee ID is required"),
})

export const updateTaskStatusBodySchema = z.object({
  status: z.enum(TASK_STATUSES),
})

export const updateTaskPriorityBodySchema = z.object({
  priority: z.enum(TASK_PRIORITIES),
})

export const updateTaskDueDateBodySchema = z.object({
  dueDate: z.string().datetime({ offset: true }).refine((date) => new Date(date) > new Date(), {
    message: "Due date must be in the future",
  }),
})

export const createTaskTypeSchema = z.object({
  name: z.string().min(1, "Task type name is required"),
  description: z.string().min(1, "Task type description is required"),
  baseRate: z.number().int().nonnegative("Base rate must be non-negative"),
})

export const listTaskTypesSchema = z.object({
  activeOnly: z.enum(["true", "false"]).optional(),
})

export const taskTypeIdParamsSchema = z.object({
  taskTypeId: z.string().min(1, "Task type ID is required"),
})

export const updateTaskTypeBodySchema = z.object({
  description: z.string().optional(),
  baseRate: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})
