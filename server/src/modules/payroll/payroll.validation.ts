import { z } from "zod"

export const taskIdParamsSchema = z.object({
  taskId: z.string().min(1, "Task id is required"),
})

export const earningIdParamsSchema = z.object({
  earningId: z.string().min(1, "Earning id is required"),
})
