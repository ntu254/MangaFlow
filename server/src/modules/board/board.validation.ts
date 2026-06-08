import mongoose from "mongoose"
import { z } from "zod"

export const seriesIdParamsSchema = z.object({
  seriesId: z.string().refine((value) => mongoose.isValidObjectId(value), { message: "Invalid series id" }),
})

export const boardVoteBodySchema = z.object({
  value: z.enum(["APPROVE", "REJECT", "NEEDS_REVISION"]),
})
