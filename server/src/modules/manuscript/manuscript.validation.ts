import { z } from "zod"

export const manuscriptIdParamsSchema = z.object({
  manuscriptId: z.string().min(1, "Manuscript id is required"),
})

export const manuscriptReviewBodySchema = z.object({
  reviewNote: z.string().trim().max(2000).optional(),
})
