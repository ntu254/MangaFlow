import mongoose, { Schema, Document } from "mongoose";

export const manuscriptStatus = [
  "DRAFT",
  "SUBMITTED",
  "EDITOR_REVIEW",
  "REVISION_REQUESTED",
  "BOARD_REVIEW",
  "APPROVED",
  "REJECTED"
] as const;

export type ManuscriptStatus = typeof manuscriptStatus[number];

export interface ManuscriptDocument extends Document {
  seriesId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  title?: string;
  description?: string;
  fileUrls: string[];
  previewUrls?: string[];
  currentVersion: number;
  status: ManuscriptStatus;
  createdAt: Date;
  updatedAt: Date;
}

const manuscriptSchema = new Schema<ManuscriptDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    fileUrls: { type: [String], required: true },
    previewUrls: { type: [String] },
    currentVersion: { type: Number, required: true, default: 1 },
    status: { type: String, enum: manuscriptStatus, default: "DRAFT" }
  },
  { timestamps: true }
);

export const ManuscriptModel = mongoose.model<ManuscriptDocument>("Manuscript", manuscriptSchema);
