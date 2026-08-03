import mongoose from "mongoose";
import { looseSchema } from "../schema.js";

export const RATE_TABLE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type RateTableStatus = (typeof RATE_TABLE_STATUSES)[number];

export type RateTableRecord = {
  id: string;
  code: string;
  label: string;
  workUnitType: string;
  amount: number;
  currency: string;
  version: number;
  status: RateTableStatus;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
};

const rateTableSchema = looseSchema({
  code: { type: String, required: true, uppercase: true, trim: true, index: true },
  label: { type: String, required: true, trim: true },
  workUnitType: { type: String, required: true, trim: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, default: "VND" },
  version: { type: Number, required: true, min: 1 },
  status: { type: String, required: true, enum: RATE_TABLE_STATUSES, default: "ACTIVE", index: true },
  effectiveFrom: { type: Date, required: true, index: true },
  effectiveTo: { type: Date },
  createdById: { type: String, required: true },
  updatedById: { type: String, required: true },
});

rateTableSchema.index({ code: 1, version: 1 }, { unique: true });
rateTableSchema.index({ code: 1, status: 1, effectiveFrom: 1 });

export const RateTableModel = mongoose.model<RateTableRecord>("RateTable", rateTableSchema);
