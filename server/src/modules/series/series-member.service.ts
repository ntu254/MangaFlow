import { AppError } from "../../shared/errors/AppError.js"
import { Series, SeriesMember } from "./series.model.js"
import { User } from "../auth/auth.model.js"

export async function addSeriesMemberService(input: {
  seriesId: string
  userId: string
  role: "ASSISTANT" | "CO_MANGAKA" | "EDITOR"
  accessScope: "FULL" | "TASK_ONLY"
  actorId: string
}) {
  const series = await Series.findById(input.seriesId)
  if (!series) throw new AppError("Series not found", 404)

  if (series.ownerId.toString() !== input.actorId) {
    throw new AppError("Only the series owner can add members", 403)
  }

  const user = await User.findById(input.userId)
  if (!user) throw new AppError("User not found", 404)
  if (!user.isActive) throw new AppError("User is not active", 400)

  // Enforce system role matches series role for ASSISTANT
  if (input.role === "ASSISTANT" && user.role !== "ASSISTANT") {
    throw new AppError("User does not have the ASSISTANT system role", 400)
  }

  const existingMember = await SeriesMember.findOne({ seriesId: input.seriesId, userId: input.userId })
  if (existingMember) {
    throw new AppError("User is already a member of this series", 409)
  }

  const member = await SeriesMember.create({
    seriesId: input.seriesId,
    userId: input.userId,
    role: input.role,
    status: "ACTIVE",
    accessScope: input.accessScope,
  })

  return member
}
