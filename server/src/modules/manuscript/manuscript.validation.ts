import mongoose from "mongoose"
import { z } from "zod"

export const manuscriptIdParamsSchema = z.object({
  manuscriptId: z.string().refine((value) => mongoose.isValidObjectId(value), { message: "Invalid manuscript id" }),
})
