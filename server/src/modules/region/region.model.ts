import mongoose, { Document, Schema } from "mongoose";

export const regionTypes = [
  "BACKGROUND",
  "INKING",
  "SCREENTONE",
  "CLEANUP",
  "EFFECT",
  "BUBBLE",
  "OTHER"
] as const;

export type RegionType = (typeof regionTypes)[number];

export const regionSources = ["MANUAL", "AI"] as const;
export type RegionSource = (typeof regionSources)[number];

export const regionShapes = ["RECTANGLE"] as const;
export type RegionShape = (typeof regionShapes)[number];

export interface RegionDocument extends Document {
  pageId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  type: RegionType;
  source: RegionSource;
  shape: RegionShape;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const regionSchema = new Schema<RegionDocument>(
  {
    pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", index: true, sparse: true },
    type: { type: String, enum: regionTypes, required: true },
    source: { type: String, enum: regionSources, required: true, default: "MANUAL" },
    shape: { type: String, enum: regionShapes, required: true, default: "RECTANGLE" },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    confidence: { type: Number },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
  },
  { timestamps: true }
);

regionSchema.index({ pageId: 1, createdAt: -1 });

export const RegionModel = mongoose.model<RegionDocument>("Region", regionSchema);

