import type { SeriesRepository } from "../series/series.service.js";
import type { Task } from "../task/task.service.js";
import type { TaskRepository } from "../task/task.repository.js";
import { taskTypes, type TaskType } from "../task/task.model.js";
import type { EarningStatus, TimingStatus } from "./payroll.model.js";
import type { PayrollRepository } from "./payroll.repository.js";

export type TaskRate = {
  id: string;
  taskType: TaskType;
  rate: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AssistantEarning = {
  id: string;
  assistantId: string;
  taskId: string;
  seriesId: string;
  taskType: TaskType;
  basePayment: number;
  bonusRate: number;
  bonusAmount: number;
  penaltyAmount: number;
  revisionFee: number;
  finalPayment: number;
  timingStatus: TimingStatus;
  status: EarningStatus;
  createdAt: string;
  updatedAt: string;
  assistantName?: string;
  taskTitle?: string;
  seriesTitle?: string;
};

export type CreateTaskRateInput = {
  taskType: TaskType;
  rate: number;
  currency?: string;
  isActive?: boolean;
};

export type UpdateTaskRateInput = Partial<CreateTaskRateInput>;

export type CreateAssistantEarningRecord = Omit<AssistantEarning, "id" | "createdAt" | "updatedAt">;

export type UpdateAssistantEarningRecord = Partial<Pick<AssistantEarning, "status">>;

export class PayrollServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

const taskTypeSet = new Set<TaskType>(taskTypes);
const approvedStatuses = new Set<Task["status"]>(["MANGAKA_APPROVED", "EDITOR_APPROVED"]);
const millisecondsPerHour = 60 * 60 * 1000;
const defaultRevisionFee = 0;

function assertTaskType(value: unknown): TaskType {
  if (typeof value !== "string" || !taskTypeSet.has(value as TaskType)) {
    throw new PayrollServiceError("INVALID_TASK_TYPE", "Invalid task type");
  }
  return value as TaskType;
}

function normalizeMoney(value: unknown, field: string) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new PayrollServiceError("INVALID_RATE", `${field} must be a non-negative number`);
  }
  return number;
}

function normalizeCurrency(value: string | undefined) {
  const currency = value?.trim() || "POINT";
  if (currency.length > 12) {
    throw new PayrollServiceError("INVALID_CURRENCY", "Currency must be 12 characters or less");
  }
  return currency;
}

function getTaskTiming(task: Task): TimingStatus {
  if (!task.dueDate) return "ON_TIME";
  const dueAt = new Date(task.dueDate).getTime();
  const completedAt = new Date(task.submittedAt ?? task.editorApprovedAt ?? task.mangakaApprovedAt ?? new Date().toISOString()).getTime();
  if (Number.isNaN(dueAt) || Number.isNaN(completedAt)) return "ON_TIME";
  const delta = completedAt - dueAt;
  if (delta <= -24 * millisecondsPerHour) return "EARLY";
  if (delta <= 0) return "ON_TIME";
  if (delta <= 24 * millisecondsPerHour) return "LATE_WITHIN_24H";
  return "LATE";
}

function getBonusRate(timingStatus: TimingStatus) {
  switch (timingStatus) {
    case "EARLY":
      return 0.1;
    case "LATE_WITHIN_24H":
      return -0.05;
    default:
      return 0;
  }
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function createPayrollService(
  payrollRepository: PayrollRepository,
  taskRepository: TaskRepository,
  seriesRepository: SeriesRepository
) {
  return {
    async createTaskRate(input: CreateTaskRateInput) {
      return payrollRepository.createTaskRate({
        taskType: assertTaskType(input.taskType),
        rate: normalizeMoney(input.rate, "Rate"),
        currency: normalizeCurrency(input.currency),
        isActive: input.isActive ?? true
      });
    },

    async listTaskRates() {
      return payrollRepository.findTaskRates();
    },

    async getTaskRate(taskRateId: string) {
      const taskRate = await payrollRepository.findTaskRateById(taskRateId);
      if (!taskRate) {
        throw new PayrollServiceError("TASK_RATE_NOT_FOUND", "Task rate not found", 404);
      }
      return taskRate;
    },

    async updateTaskRate(taskRateId: string, input: UpdateTaskRateInput) {
      const update: UpdateTaskRateInput = {};
      if (input.taskType !== undefined) update.taskType = assertTaskType(input.taskType);
      if (input.rate !== undefined) update.rate = normalizeMoney(input.rate, "Rate");
      if (input.currency !== undefined) update.currency = normalizeCurrency(input.currency);
      if (input.isActive !== undefined) update.isActive = Boolean(input.isActive);
      const updated = await payrollRepository.updateTaskRate(taskRateId, update);
      if (!updated) {
        throw new PayrollServiceError("TASK_RATE_NOT_FOUND", "Task rate not found", 404);
      }
      return updated;
    },

    async deactivateTaskRate(taskRateId: string) {
      const updated = await payrollRepository.deactivateTaskRate(taskRateId);
      if (!updated) {
        throw new PayrollServiceError("TASK_RATE_NOT_FOUND", "Task rate not found", 404);
      }
      return updated;
    },

    async calculateTaskEarning(taskId: string) {
      const task = await taskRepository.findById(taskId);
      if (!task) {
        throw new PayrollServiceError("TASK_NOT_FOUND", "Task not found", 404);
      }
      if (task.status === "REJECTED") {
        throw new PayrollServiceError("REJECTED_TASK", "Rejected tasks do not create earnings");
      }
      if (!approvedStatuses.has(task.status)) {
        throw new PayrollServiceError("TASK_NOT_APPROVED", "Task must be approved before payroll calculation");
      }

      const activeRate = await payrollRepository.findActiveTaskRate(task.type);
      const basePayment = activeRate?.rate ?? task.baseRate;
      const timingStatus = getTaskTiming(task);
      const bonusRate = getBonusRate(timingStatus);
      const bonusAmount = bonusRate > 0 ? roundMoney(basePayment * bonusRate) : 0;
      const penaltyAmount = bonusRate < 0 ? roundMoney(Math.abs(basePayment * bonusRate)) : 0;
      const revisionFee = task.revisionRound > 1 ? defaultRevisionFee : 0;
      const finalPayment = roundMoney(basePayment + bonusAmount - penaltyAmount + revisionFee);

      return payrollRepository.createOrUpdateEarning({
        assistantId: task.assignedTo,
        taskId: task.id,
        seriesId: task.seriesId,
        taskType: task.type,
        basePayment,
        bonusRate,
        bonusAmount,
        penaltyAmount,
        revisionFee,
        finalPayment,
        timingStatus,
        status: "PENDING"
      });
    },

    async confirmTaskEarning(taskId: string) {
      const earning = await payrollRepository.findEarningByTaskId(taskId);
      if (!earning) {
        throw new PayrollServiceError("EARNING_NOT_FOUND", "Earning not found", 404);
      }
      if (earning.status !== "PENDING") {
        throw new PayrollServiceError("INVALID_EARNING_STATUS", "Only pending earnings can be confirmed");
      }
      const updated = await payrollRepository.updateEarning(earning.id, { status: "CONFIRMED" });
      if (!updated) {
        throw new PayrollServiceError("EARNING_NOT_FOUND", "Earning not found", 404);
      }
      return updated;
    },

    async markPaid(earningId: string) {
      const earning = await payrollRepository.findEarningById(earningId);
      if (!earning) {
        throw new PayrollServiceError("EARNING_NOT_FOUND", "Earning not found", 404);
      }
      if (earning.status !== "CONFIRMED") {
        throw new PayrollServiceError("INVALID_EARNING_STATUS", "Only confirmed earnings can be marked paid");
      }
      const updated = await payrollRepository.updateEarning(earning.id, { status: "PAID" });
      if (!updated) {
        throw new PayrollServiceError("EARNING_NOT_FOUND", "Earning not found", 404);
      }
      return updated;
    },

    async listEarnings() {
      return payrollRepository.findEarnings();
    },

    async listEarningsForAssistant(assistantId: string) {
      return payrollRepository.findEarningsByAssistant(assistantId);
    },

    async listEarningsForSeries(seriesId: string) {
      return payrollRepository.findEarningsBySeries(seriesId);
    },

    async getMonthlySummary() {
      const earnings = await payrollRepository.findEarnings();
      const totalPending = earnings.filter((earning) => earning.status === "PENDING").reduce((sum, earning) => sum + earning.finalPayment, 0);
      const totalConfirmed = earnings.filter((earning) => earning.status === "CONFIRMED").reduce((sum, earning) => sum + earning.finalPayment, 0);
      const totalPaid = earnings.filter((earning) => earning.status === "PAID").reduce((sum, earning) => sum + earning.finalPayment, 0);
      return {
        totalPending: roundMoney(totalPending),
        totalConfirmed: roundMoney(totalConfirmed),
        totalPaid: roundMoney(totalPaid),
        count: earnings.length
      };
    },

    async userHasSeriesAccess(seriesId: string, userId: string) {
      return Boolean(await seriesRepository.getSeriesMemberRole(seriesId, userId));
    }
  };
}

export type PayrollService = ReturnType<typeof createPayrollService>;
