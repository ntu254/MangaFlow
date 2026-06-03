import mongoose, { Document, Schema } from "mongoose";

export const commentTargetTypes = [
  "MANUSCRIPT",
  "CHAPTER",
  "PAGE",
  "TASK",
  "SUBMISSION"
] as const;

export type CommentTargetType = (typeof commentTargetTypes)[number];

export const commentStatuses = [
  "OPEN",
  "FIXED_BY_ASSISTANT",
  "VERIFIED_BY_MANGAKA",
  "RESOLVED_BY_EDITOR"
] as const;

export type CommentStatus = (typeof commentStatuses)[number];

export interface CommentDocument extends Document {
  targetType: CommentTargetType;
  targetId: mongoose.Types.ObjectId;
  pageId?: mongoose.Types.ObjectId;
  annotationId?: mongoose.Types.ObjectId;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  status: CommentStatus;
  
  fixedBy?: mongoose.Types.ObjectId;
  fixedAt?: Date;
  
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  
  reopenedBy?: mongoose.Types.ObjectId;
  reopenedAt?: Date;
  reopenReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<CommentDocument>(
  {
    targetType: { type: String, enum: commentTargetTypes, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    pageId: { type: Schema.Types.ObjectId, ref: "Page" },
    annotationId: { type: Schema.Types.ObjectId, ref: "Annotation" },
    content: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: commentStatuses, required: true, default: "OPEN", index: true },
    
    fixedBy: { type: Schema.Types.ObjectId, ref: "User" },
    fixedAt: { type: Date },
    
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
    
    reopenedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reopenedAt: { type: Date },
    reopenReason: { type: String }
  },
  { timestamps: true }
);

// Indexes for fast lookup by target
commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
commentSchema.index({ pageId: 1, createdAt: -1 });

export const CommentModel = mongoose.model<CommentDocument>("Comment", commentSchema);
