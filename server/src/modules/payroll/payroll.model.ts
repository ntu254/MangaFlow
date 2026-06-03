import mongoose, { Document, Schema } from "mongoose";
import { taskTypes, type TaskType } from "../task/task.model.js";

export const timingStatuses = ["EARLY", "ON_TIME", "LATE_WITHIN_24H", "LATE"] as const;
export type TimingStatus = (typeof timingStatuses)[number];

export const earningStatuses = ["PENDING", "CONFIRMED", "PAID", "CANCELLED"] as const;
export type EarningStatus = (typeof earningStatuses)[number];

export interface TaskRateDocument extends Document {
  taskType: TaskType;
  rate: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssistantEarningDocument extends Document {
  assistantId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  seriesId: mongoose.Types.ObjectId;
  taskType: TaskType;
  basePayment: number;
  bonusRate: number;
  bonusAmount: number;
  penaltyAmount: number;
  revisionFee: number;
  finalPayment: number;
  timingStatus: TimingStatus;
  status: EarningStatus;
  createdAt: Date;
  updatedAt: Date;
}

const taskRateSchema = new Schema<TaskRateDocument>(
  {
    taskType: { type: String, enum: taskTypes, required: true, index: true },
    rate: { type: Number, required: true },
    currency: { type: String, required: true, default: "POINT" },
    isActive: { type: Boolean, required: true, default: true, index: true }
  },
  { timestamps: true }
);

taskRateSchema.index({ taskType: 1, isActive: 1 });

const assistantEarningSchema = new Schema<AssistantEarningDocument>(
  {
    assistantId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, unique: true, index: true },
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    taskType: { type: String, enum: taskTypes, required: true },
    basePayment: { type: Number, required: true },
    bonusRate: { type: Number, required: true, default: 0 },
    bonusAmount: { type: Number, required: true, default: 0 },
    penaltyAmount: { type: Number, required: true, default: 0 },
    revisionFee: { type: Number, required: true, default: 0 },
    finalPayment: { type: Number, required: true },
    timingStatus: { type: String, enum: timingStatuses, required: true },
    status: { type: String, enum: earningStatuses, required: true, default: "PENDING", index: true }
  },
  { timestamps: true }
);

assistantEarningSchema.index({ assistantId: 1, status: 1 });
assistantEarningSchema.index({ seriesId: 1, status: 1 });

export const TaskRateModel = mongoose.model<TaskRateDocument>("TaskRate", taskRateSchema);
export const AssistantEarningModel = mongoose.model<AssistantEarningDocument>("AssistantEarning", assistantEarningSchema);
