import type { AssistantEarningStatus } from "../../shared/workflow/status.js"
import { Task } from "../task/task.model.js"
import { AssistantEarning } from "./payroll.model.js"

export interface CreateEarningInput {
  taskId: string
  seriesId: string
  chapterId: string
  assistantId: string
  baseRate: number
  deadlineMultiplier: number
  finalPayment: number
  isLate: boolean
  calculatedAt: Date
}

export async function getTaskForPayroll(taskId: string) {
  return Task.findById(taskId)
}

export async function getEarningByTaskId(taskId: string) {
  return AssistantEarning.findOne({ taskId })
}

export async function createEarningRecord(input: CreateEarningInput) {
  return AssistantEarning.create({
    taskId: input.taskId,
    seriesId: input.seriesId,
    chapterId: input.chapterId,
    assistantId: input.assistantId,
    baseRate: input.baseRate,
    deadlineMultiplier: input.deadlineMultiplier,
    finalPayment: input.finalPayment,
    isLate: input.isLate,
    status: "PENDING",
    calculatedAt: input.calculatedAt,
  })
}

export async function getEarningById(earningId: string) {
  return AssistantEarning.findById(earningId)
}

export async function updateEarningStatus(
  earningId: string,
  status: AssistantEarningStatus,
  actorField: "confirmedBy" | "paidBy",
  actorId: string,
) {
  const timestampField = actorField === "confirmedBy" ? "confirmedAt" : "paidAt"
  return AssistantEarning.findByIdAndUpdate(
    earningId,
    { status, [actorField]: actorId, [timestampField]: new Date() },
    { new: true },
  )
}

export async function listEarnings(query: Record<string, unknown>) {
  return AssistantEarning.find(query).sort({ createdAt: -1 }).lean()
}
