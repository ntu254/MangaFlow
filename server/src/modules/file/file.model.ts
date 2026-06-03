import mongoose, { Schema, Document } from "mongoose";

export const fileOwnerType = ["MANUSCRIPT", "PAGE", "SUBMISSION", "AI_OUTPUT"] as const;
export type FileOwnerType = typeof fileOwnerType[number];

export interface FileAssetDocument extends Document {
  ownerType: FileOwnerType;
  ownerId: mongoose.Types.ObjectId;
  originalUrl: string;
  aiProcessUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  versionNumber: number;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const fileAssetSchema = new Schema<FileAssetDocument>(
  {
    ownerType: { type: String, enum: fileOwnerType, required: true },
    ownerId: { type: Schema.Types.ObjectId, required: true },
    originalUrl: { type: String, required: true, trim: true },
    aiProcessUrl: { type: String, trim: true },
    previewUrl: { type: String, trim: true },
    thumbnailUrl: { type: String, trim: true },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    versionNumber: { type: Number, required: true, default: 1 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

// Index to quickly query assets of a specific domain owner
fileAssetSchema.index({ ownerType: 1, ownerId: 1, versionNumber: -1 });

export const FileAssetModel = mongoose.model<FileAssetDocument>("FileAsset", fileAssetSchema);
