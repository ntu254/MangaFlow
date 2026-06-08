import { AppError } from "../../shared/errors/AppError.js"
import type { UserRole } from "../auth/auth.types.js"
import { SeriesMember } from "../series/series.model.js"
import {
  createEarningRecord,
  getEarningById,
  getEarningByTaskId,
  getTaskForPayroll,
  listEarnings,
  updateEarningStatus,
} from "./payroll.repository.js"

interface PayrollActor {
  userId: string
  role: UserRole
}

interface DeadlineMultiplierResult {
  multiplier: number
  isLate: boolean
}

export function calculateDeadlineMultiplier(taskStatus: string, dueDate: Date, completedAt: Date): DeadlineMultiplierResult {
  if (taskStatus === "REJECTED") {
    return { multiplier: 0, isLate: false }
  }

  const oneDayMs = 24 * 60 * 60 * 1000
  const delta = completedAt.getTime() - dueDate.getTime()

  if (delta <= -oneDayMs) {
    return { multiplier: 1.1, isLate: false }
  }
  if (delta <= 0) {
    return { multiplier: 1, isLate: false }
  }
  if (delta <= oneDayMs) {
    return { multiplier: 0.95, isLate: true }
  }
  return { multiplier: 1, isLate: true }
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

async function assertSeriesMangakaOrAdmin(seriesId: string, actor: PayrollActor) {
  if (actor.role === "ADMIN") return
  if (actor.role !== "MANGAKA") {
    throw new AppError("Payroll access denied", 403)
  }
  const member = await SeriesMember.findOne({ seriesId, userId: actor.userId })
  if (!member || !member.isActive || member.role !== "MANGAKA") {
    throw new AppError("Payroll access denied", 403)
  }
}

async function assertEarningMangakaOrAdmin(earning: any, actor: PayrollActor) {
  await assertSeriesMangakaOrAdmin(String(earning.seriesId), actor)
}

export async function calculateTaskEarningService(taskId: string, actor: PayrollActor) {
  const task = await getTaskForPayroll(taskId)
  if (!task) {
    throw new AppError("Task not found", 404)
  }

  await assertSeriesMangakaOrAdmin(String(task.seriesId), actor)

  if (!["EDITOR_APPROVED", "REJECTED"].includes(task.status)) {
    throw new AppError("Payroll can be calculated only after Editor approval or rejection", 409)
  }

  const existing = await getEarningByTaskId(taskId)
  if (existing) {
    if (existing.status !== "PENDING") {
      throw new AppError("Confirmed or paid earnings cannot be recalculated", 409)
    }
    return existing
  }

  const completedAt = task.updatedAt instanceof Date ? task.updatedAt : new Date()
  const { multiplier, isLate } = calculateDeadlineMultiplier(task.status, task.dueDate, completedAt)
  const finalPayment = roundMoney(task.baseRate * multiplier)

  return createEarningRecord({
    taskId,
    seriesId: String(task.seriesId),
    chapterId: String(task.chapterId),
    assistantId: String(task.assignedTo),
    baseRate: task.baseRate,
    deadlineMultiplier: multiplier,
    finalPayment,
    isLate,
    calculatedAt: new Date(),
  })
}

export async function confirmTaskEarningService(taskId: string, actor: PayrollActor) {
  const earning = await getEarningByTaskId(taskId)
  if (!earning) {
    throw new AppError("Earning not found", 404)
  }
  await assertEarningMangakaOrAdmin(earning, actor)

  if (earning.status !== "PENDING") {
    throw new AppError("Only pending earnings can be confirmed", 409)
  }

  return updateEarningStatus(String(earning._id), "CONFIRMED", "confirmedBy", actor.userId)
}

export async function markEarningPaidService(earningId: string, actor: PayrollActor) {
  if (actor.role !== "ADMIN") {
    throw new AppError("Only Admin can mark earnings paid", 403)
  }

  const earning = await getEarningById(earningId)
  if (!earning) {
    throw new AppError("Earning not found", 404)
  }
  if (earning.status !== "CONFIRMED") {
    throw new AppError("Only confirmed earnings can be marked paid", 409)
  }

  return updateEarningStatus(earningId, "PAID", "paidBy", actor.userId)
}

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
