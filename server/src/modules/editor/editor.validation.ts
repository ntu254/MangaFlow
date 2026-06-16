import mongoose from "mongoose"
import { z } from "zod"

export const editorSeriesIdParamsSchema = z.object({
  seriesId: z.string().refine((value) => mongoose.isValidObjectId(value), { message: "Invalid series id" }),
})

export const editorRevisionBodySchema = z.object({
  revisionReason: z.string().trim().min(1, "Revision reason is required").max(2000),
  feedbackSummary: z.string().trim().min(1, "Feedback summary is required").max(2000),
  reviewNote: z.string().trim().max(2000).optional(),
})

export const editorRejectBodySchema = z.object({
  rejectReason: z.string().trim().min(1, "Reject reason is required").max(2000),
  reviewNote: z.string().trim().max(2000).optional(),
})

export const editorForwardBodySchema = z.object({
  editorRecommendation: z.string().trim().min(1, "Editor recommendation is required").max(2000),
  feasibilityNote: z.string().trim().min(1, "Feasibility note is required").max(2000),
  suggestedPublicationType: z.enum(["WEEKLY", "MONTHLY"]),
  riskNote: z.string().trim().max(2000).optional(),
})
