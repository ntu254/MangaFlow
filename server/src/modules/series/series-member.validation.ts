import mongoose from "mongoose"
import { z } from "zod"

const objectId = z.string().refine((value) => mongoose.isValidObjectId(value), {
  message: "Invalid id",
})

export const addSeriesMemberSchema = z
  .object({
    userId: objectId.optional(),
    email: z.string().email("Invalid email address").optional(),
    role: z.enum(["ASSISTANT", "CO_MANGAKA", "EDITOR"]),
    accessScope: z.enum(["FULL", "TASK_ONLY"]),
  })
  .refine((data) => Boolean(data.userId || data.email), {
    message: "Either userId or email is required",
  })

export const updateSeriesMemberSchema = z.object({
  params: z.object({
    seriesId: objectId,
    memberId: objectId,
  }),
  body: z.object({
    /** Flow-03: pause or reactivate a member */
    status: z.enum(["ACTIVE", "PAUSED"]),
  }),
})

export const memberIdParamsSchema = z.object({
  seriesId: objectId,
  memberId: objectId,
})

export const acceptSeriesMemberSchema = z.object({
  params: z.object({
    seriesId: objectId,
    memberId: objectId,
  }),
})

export const acceptOwnSeriesInviteSchema = z.object({
  params: z.object({
    seriesId: objectId,
  }),
})

export type AddSeriesMemberInput = z.infer<typeof addSeriesMemberSchema>
export type UpdateSeriesMemberInput = z.infer<typeof updateSeriesMemberSchema>
