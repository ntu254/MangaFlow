import { AppError } from "../../../shared/errors/AppError.js"
import type { UserRole } from "../../auth/auth.types.js"
import { findActiveSeriesMember } from "../../../shared/policies/seriesMember.policy.js"

export interface PayrollActor {
  userId: string
  role: UserRole
}

export async function assertSeriesMangakaOrAdmin(seriesId: string, actor: PayrollActor) {
  if (actor.role === "ADMIN") return
  if (actor.role !== "MANGAKA") {
    throw new AppError("Payroll access denied", 403)
  }
  const member = await findActiveSeriesMember(seriesId, actor.userId)
  if (!member || member.role !== "MANGAKA") {
    throw new AppError("Payroll access denied", 403)
  }
}

export async function assertEarningMangakaOrAdmin(earning: any, actor: PayrollActor) {
  await assertSeriesMangakaOrAdmin(String(earning.seriesId), actor)
}
