import { z } from "zod"

export const createPublicationSchema = z.object({
  chapterId: z.string().min(1, "Chapter ID is required"),
  scheduledFor: z.string().datetime("scheduledFor must be an ISO date").optional(),
})

export const publicationIdParamsSchema = z.object({
  publicationId: z.string().min(1, "Publication ID is required"),
})

export const schedulePublicationBodySchema = z.object({
  scheduledFor: z.string().datetime("scheduledFor must be an ISO date"),
})

export const patchPublicationBodySchema = z.object({
  scheduledFor: z.string().datetime("scheduledFor must be an ISO date").optional(),
})
