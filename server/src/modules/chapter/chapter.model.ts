import mongoose, { Schema, Document } from "mongoose";

export const chapterStatus = [
  "DRAFT",
  "IN_PROGRESS",
  "READY_FOR_EDITOR",
  "EDITOR_REVIEW",
  "READY_FOR_PUBLICATION",
  "PUBLISHED"
] as const;

export type ChapterStatus = typeof chapterStatus[number];

export interface ChapterDocument extends Document {
  seriesId: mongoose.Types.ObjectId;
  title: string;
  chapterNumber: number;
  status: ChapterStatus;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chapterSchema = new Schema<ChapterDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true },
    title: { type: String, required: true, trim: true },
    chapterNumber: { type: Number, required: true },
    status: { type: String, enum: chapterStatus, default: "DRAFT" },
    deadline: { type: Date }
  },
  { timestamps: true }
);

// Compound index to ensure unique chapter number per series
chapterSchema.index({ seriesId: 1, chapterNumber: 1 }, { unique: true });

export const ChapterModel = mongoose.model<ChapterDocument>("Chapter", chapterSchema);
