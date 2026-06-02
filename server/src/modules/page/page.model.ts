import mongoose, { Schema, Document } from "mongoose";

export const pageStatus = [
  "UPLOADED",
  "AI_PROCESSED",
  "REGION_MARKED",
  "TASK_ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "NEEDS_REVISION",
  "READY_TO_PUBLISH"
] as const;

export type PageStatus = typeof pageStatus[number];

export interface PageDocument extends Document {
  chapterId: mongoose.Types.ObjectId;
  pageNumber: number;
  originalFileUrl: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  processedFileUrl?: string;
  width: number;
  height: number;
  currentVersion: number;
  status: PageStatus;
  createdAt: Date;
  updatedAt: Date;
}

const pageSchema = new Schema<PageDocument>(
  {
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
    pageNumber: { type: Number, required: true },
    originalFileUrl: { type: String, required: true, trim: true },
    previewUrl: { type: String, trim: true },
    thumbnailUrl: { type: String, trim: true },
    processedFileUrl: { type: String, trim: true },
    width: { type: Number, required: true, default: 1200 },
    height: { type: Number, required: true, default: 1600 },
    currentVersion: { type: Number, required: true, default: 1 },
    status: { type: String, enum: pageStatus, default: "UPLOADED" }
  },
  { timestamps: true }
);

// Compound index to ensure unique page number per chapter
pageSchema.index({ chapterId: 1, pageNumber: 1 }, { unique: true });

export const PageModel = mongoose.model<PageDocument>("Page", pageSchema);
