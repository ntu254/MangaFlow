import mongoose, { Document, Schema } from "mongoose";

export const submissionStatuses = [
  "PENDING_MANGAKA_REVIEW",
  "REVISION_REQUESTED",
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "REJECTED"
] as const;

export type SubmissionStatus = (typeof submissionStatuses)[number];

export interface SubmissionDocument extends Document {
  taskId: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  fileUrl: string;
  previewUrl?: string;
  note?: string;
  version: number;
  status: SubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<SubmissionDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileUrl: { type: String, required: true },
    previewUrl: { type: String },
    note: { type: String },
    version: { type: Number, required: true },
    status: { type: String, enum: submissionStatuses, required: true, default: "PENDING_MANGAKA_REVIEW", index: true }
  },
  { timestamps: true }
);

submissionSchema.index({ taskId: 1, version: -1 });
submissionSchema.index({ taskId: 1, version: 1 }, { unique: true });
submissionSchema.index({ submittedBy: 1, createdAt: -1 });

export const SubmissionModel = mongoose.model<SubmissionDocument>("Submission", submissionSchema);
