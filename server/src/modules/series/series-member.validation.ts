import mongoose from "mongoose"
import { z } from "zod"

const objectId = z.string().refine((value) => mongoose.isValidObjectId(value), {
  message: "Invalid id",
})

export const addSeriesMemberSchema = z.object({
  userId: objectId,
  role: z.enum(["ASSISTANT", "CO_MANGAKA", "EDITOR"]),
  accessScope: z.enum(["FULL", "TASK_ONLY"]),
})

export type AddSeriesMemberInput = z.infer<typeof addSeriesMemberSchema>
