import mongoose from "mongoose";
import type { EarningItemStatus, EarningStatus } from "../../types.js";
import { looseSchema } from "../schema.js";

/* ------------------------------------------------------------------ */
/*  Earning                                                             */
/* ------------------------------------------------------------------ */

export type EarningRecord = {
  id: string;
  assistantId: string;
  period: string;
  sourceKey?: string;
  taskId?: string;
  submissionId?: string;
  seriesId?: string;
  chapterId?: string;
  subtotal?: number;
  bonus?: number;
  penalty?: number;
  amount: number;
  currency: string;
  status: EarningStatus;
  confirmedById?: string;
  confirmedAt?: Date;
  paidAt?: Date;
  paidById?: string;
  createdAt: Date;
  updatedAt: Date;
};

const earningSchema = looseSchema({
  assistantId: { type: String, required: true, index: true },
  period: { type: String, required: true, index: true },
  sourceKey: { type: String },
  taskId: { type: String },
  submissionId: { type: String, index: true },
  seriesId: { type: String, index: true },
  chapterId: { type: String, index: true },
  subtotal: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  penalty: { type: Number, default: 0 },
  amount: { type: Number, required: true, default: 0 },
  currency: { type: String, default: "VND" },
  status: {
    type: String,
    required: true,
    enum: ["PENDING", "CONFIRMED", "PAID", "VOIDED", "EARNED", "ADJUSTED", "REVERSED"],
    default: "PENDING",
    index: true,
  },
  confirmedById: { type: String },
  confirmedAt: { type: Date },
  paidAt: { type: Date },
  paidById: { type: String },
});

earningSchema.index({ assistantId: 1, period: 1 });
earningSchema.index({ sourceKey: 1 }, { unique: true, sparse: true });
earningSchema.index({ taskId: 1 }, { unique: true, sparse: true });

/* ------------------------------------------------------------------ */
/*  EarningItem (new collection — traces earnings back to tasks)        */
/* ------------------------------------------------------------------ */

export type EarningItemRecord = {
  id: string;
  earningId: string;
  assistantId: string;
  taskId?: string;
  submissionId?: string;
  seriesId?: string;
  chapterId?: string;
  taskType?: string;
  rate?: number;
  amount: number;
  currency: string;
  status: EarningItemStatus;
  approvedById?: string;
  approvedAt?: Date;
  voidedById?: string;
  voidedAt?: Date;
  voidReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

const earningItemSchema = looseSchema({
  earningId: { type: String, required: true, index: true },
  assistantId: { type: String, required: true, index: true },
  taskId: { type: String },
  submissionId: { type: String, index: true },
  seriesId: { type: String, index: true },
  chapterId: { type: String, index: true },
  taskType: { type: String },
  rate: { type: Number },
  amount: { type: Number, required: true, default: 0 },
  currency: { type: String, default: "VND" },
  status: {
    type: String,
    required: true,
    enum: ["PENDING", "APPROVED", "VOIDED"],
    default: "PENDING",
    index: true,
  },
  approvedById: { type: String },
  approvedAt: { type: Date },
  voidedById: { type: String },
  voidedAt: { type: Date },
  voidReason: { type: String },
});

// One earning item per task (a task can only be paid once)
earningItemSchema.index({ taskId: 1 }, { unique: true, sparse: true });

/* ------------------------------------------------------------------ */

export const EarningModel = mongoose.model<any>("Earning", earningSchema);
export const EarningItemModel = mongoose.model<any>("EarningItem", earningItemSchema);
