import mongoose from "mongoose"
import { z } from "zod"

export const seriesIdParamsSchema = z.object({
  seriesId: z.string().refine((value) => mongoose.isValidObjectId(value), { message: "Invalid series id" }),
})

export const boardVoteBodySchema = z.object({
  value: z.enum(["APPROVE", "REJECT", "NEEDS_REVISION"]),
})


export const atRiskDecisionBodySchema = z.object({
  decision: z.enum(["CONTINUE", "WARNING", "REQUEST_IMPROVEMENT_PLAN", "CANCEL"]),
  note: z.string().max(2000).optional(),
})
