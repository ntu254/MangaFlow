import { AppError } from "../../../shared/errors/AppError.js"
import { SeriesMember } from "../../series/series.model.js"
import { listEarnings } from "../payroll.repository.js"
import type { PayrollActor } from "../policies/payroll-access.policy.js"

export async function listPayrollEarningsService(actor: PayrollActor) {
  if (actor.role === "ADMIN") {
    return listEarnings({})
  }
  if (actor.role === "ASSISTANT") {
    return listEarnings({ assistantId: actor.userId })
  }
  if (actor.role === "MANGAKA") {
    const memberships = await SeriesMember.find({ userId: actor.userId, role: "MANGAKA", isActive: true }).lean()
    return listEarnings({ seriesId: { $in: memberships.map((member: any) => member.seriesId) } })
  }
  throw new AppError("Payroll access denied", 403)
}
