import { AppError } from "../../../shared/errors/AppError.js"
import type { UserRole } from "../../auth/auth.types.js"
import { SeriesMember } from "../../series/series.model.js"

export interface PayrollActor {
  userId: string
  role: UserRole
}

export async function assertSeriesMangakaOrAdmin(seriesId: string, actor: PayrollActor) {
  if (actor.role === "ADMIN") return
  if (actor.role !== "MANGAKA") {
    throw new AppError("Payroll access denied", 403)
  }
  const member = await SeriesMember.findOne({ seriesId, userId: actor.userId })
  if (!member || !member.isActive || member.role !== "MANGAKA") {
    throw new AppError("Payroll access denied", 403)
  }
}

export async function assertEarningMangakaOrAdmin(earning: any, actor: PayrollActor) {
  await assertSeriesMangakaOrAdmin(String(earning.seriesId), actor)
}
