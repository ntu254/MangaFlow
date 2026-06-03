import mongoose from "mongoose";
import { AssistantEarningModel, TaskRateModel, type AssistantEarningDocument, type TaskRateDocument } from "./payroll.model.js";
import type {
  AssistantEarning,
  CreateAssistantEarningRecord,
  CreateTaskRateInput,
  TaskRate,
  UpdateAssistantEarningRecord,
  UpdateTaskRateInput
} from "./payroll.service.js";
import type { TaskType } from "../task/task.model.js";

function serializeTaskRate(document: TaskRateDocument & { _id: unknown }): TaskRate {
  return {
    id: String(document._id),
    taskType: document.taskType,
    rate: document.rate,
    currency: document.currency,
    isActive: document.isActive,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

function serializeAssistantEarning(document: AssistantEarningDocument & { _id: unknown }): AssistantEarning {
  return {
    id: String(document._id),
    assistantId: String(document.assistantId),
    taskId: String(document.taskId),
    seriesId: String(document.seriesId),
    taskType: document.taskType,
    basePayment: document.basePayment,
    bonusRate: document.bonusRate,
    bonusAmount: document.bonusAmount,
    penaltyAmount: document.penaltyAmount,
    revisionFee: document.revisionFee,
    finalPayment: document.finalPayment,
    timingStatus: document.timingStatus,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function createMongoPayrollRepository() {
  return {
    async createTaskRate(input: CreateTaskRateInput): Promise<TaskRate> {
      const taskRate = await TaskRateModel.create(input);
      return serializeTaskRate(taskRate);
    },

    async findTaskRates(): Promise<TaskRate[]> {
      const rates = await TaskRateModel.find().sort({ taskType: 1, updatedAt: -1 }).limit(100);
      return rates.map(serializeTaskRate);
    },

    async findTaskRateById(taskRateId: string): Promise<TaskRate | null> {
      if (!mongoose.isValidObjectId(taskRateId)) return null;
      const rate = await TaskRateModel.findById(taskRateId);
      return rate ? serializeTaskRate(rate) : null;
    },

    async findActiveTaskRate(taskType: TaskType): Promise<TaskRate | null> {
      const rate = await TaskRateModel.findOne({ taskType, isActive: true }).sort({ updatedAt: -1 });
      return rate ? serializeTaskRate(rate) : null;
    },

    async updateTaskRate(taskRateId: string, input: UpdateTaskRateInput): Promise<TaskRate | null> {
      if (!mongoose.isValidObjectId(taskRateId)) return null;
      const update: Record<string, unknown> = {};
      if (input.taskType !== undefined) update.taskType = input.taskType;
      if (input.rate !== undefined) update.rate = input.rate;
      if (input.currency !== undefined) update.currency = input.currency;
      if (input.isActive !== undefined) update.isActive = input.isActive;
      const rate = await TaskRateModel.findByIdAndUpdate(taskRateId, { $set: update }, { new: true });
      return rate ? serializeTaskRate(rate) : null;
    },

    async deactivateTaskRate(taskRateId: string): Promise<TaskRate | null> {
      return this.updateTaskRate(taskRateId, { isActive: false });
    },

    async createOrUpdateEarning(input: CreateAssistantEarningRecord): Promise<AssistantEarning> {
      const earning = await AssistantEarningModel.findOneAndUpdate(
        { taskId: input.taskId },
        { $set: input },
        { upsert: true, new: true }
      );
      return serializeAssistantEarning(earning);
    },

    async findEarningById(earningId: string): Promise<AssistantEarning | null> {
      if (!mongoose.isValidObjectId(earningId)) return null;
      const earning = await AssistantEarningModel.findById(earningId);
      return earning ? serializeAssistantEarning(earning) : null;
    },

    async findEarningByTaskId(taskId: string): Promise<AssistantEarning | null> {
      if (!mongoose.isValidObjectId(taskId)) return null;
      const earning = await AssistantEarningModel.findOne({ taskId });
      return earning ? serializeAssistantEarning(earning) : null;
    },

    async findEarnings(): Promise<AssistantEarning[]> {
      const earnings = await AssistantEarningModel.find().sort({ createdAt: -1 }).limit(200);
      return earnings.map(serializeAssistantEarning);
    },

    async findEarningsByAssistant(assistantId: string): Promise<AssistantEarning[]> {
      if (!mongoose.isValidObjectId(assistantId)) return [];
      const earnings = await AssistantEarningModel.find({ assistantId }).sort({ createdAt: -1 }).limit(200);
      return earnings.map(serializeAssistantEarning);
    },

    async findEarningsBySeries(seriesId: string): Promise<AssistantEarning[]> {
      if (!mongoose.isValidObjectId(seriesId)) return [];
      const earnings = await AssistantEarningModel.find({ seriesId }).sort({ createdAt: -1 }).limit(200);
      return earnings.map(serializeAssistantEarning);
    },

    async updateEarning(earningId: string, input: UpdateAssistantEarningRecord): Promise<AssistantEarning | null> {
      if (!mongoose.isValidObjectId(earningId)) return null;
      const earning = await AssistantEarningModel.findByIdAndUpdate(earningId, { $set: input }, { new: true });
      return earning ? serializeAssistantEarning(earning) : null;
    }
  };
}

export type PayrollRepository = ReturnType<typeof createMongoPayrollRepository>;
