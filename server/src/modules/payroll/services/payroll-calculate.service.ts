import { AppError } from "../../../shared/errors/AppError.js"
import {
  createEarningRecord,
  getEarningByTaskId,
  getTaskForPayroll,
} from "../payroll.repository.js"
import { calculateDeadlineMultiplier, roundMoney } from "../utils/payroll-calculation.js"
import { assertSeriesMangakaOrAdmin, type PayrollActor } from "../policies/payroll-access.policy.js"

export async function calculateTaskEarningService(taskId: string, actor: PayrollActor) {
  const task = await getTaskForPayroll(taskId)
  if (!task) {
    throw new AppError("Task not found", 404)
  }

  await assertSeriesMangakaOrAdmin(String(task.seriesId), actor)

  if (task.status !== "EDITOR_APPROVED") {
    throw new AppError("Payroll can be calculated only after Editor approval", 409)
  }

  const existing = await getEarningByTaskId(taskId)
  if (existing) {
    if (existing.status !== "PENDING") {
      throw new AppError("Confirmed or paid earnings cannot be recalculated", 409)
    }
    return existing
  }

  const completedAt = task.updatedAt instanceof Date ? task.updatedAt : new Date()
  const { multiplier, isLate } = calculateDeadlineMultiplier(task.dueDate, completedAt)
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
