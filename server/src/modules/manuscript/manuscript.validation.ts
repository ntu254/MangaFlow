import { z } from "zod"

export const manuscriptIdParamsSchema = z.object({
  manuscriptId: z.string().min(1, "Manuscript id is required"),
})

export const manuscriptReviewBodySchema = z.object({
  reviewNote: z.string().trim().max(2000).optional(),
  revisionReason: z.string().trim().max(2000).optional(),
  feedbackSummary: z.string().trim().max(2000).optional(),
  rejectReason: z.string().trim().max(2000).optional(),
  editorRecommendation: z.string().trim().max(2000).optional(),
  feasibilityNote: z.string().trim().max(2000).optional(),
  suggestedPublicationType: z.enum(["WEEKLY", "MONTHLY"]).optional(),
  riskNote: z.string().trim().max(2000).optional(),
})
