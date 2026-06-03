import mongoose, { Document, Schema } from "mongoose";

export const taskTypes = ["BACKGROUND", "INKING", "SCREENTONE", "CLEANUP", "EFFECT", "OTHER"] as const;
export type TaskType = (typeof taskTypes)[number];

export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof taskPriorities)[number];

export const taskStatuses = [
  "TODO",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVISION_REQUESTED",
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "REJECTED"
] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export interface TaskDocument extends Document {
  seriesId: mongoose.Types.ObjectId;
  chapterId: mongoose.Types.ObjectId;
  pageId: mongoose.Types.ObjectId;
  regionId?: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  revisionRound: number;
  baseRate: number;
  bonusAmount: number;
  dueDate?: Date;
  submittedAt?: Date;
  mangakaApprovedAt?: Date;
  editorApprovedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true, index: true },
    pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    regionId: { type: Schema.Types.ObjectId, ref: "Region", index: true, sparse: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: taskTypes, required: true },
    priority: { type: String, enum: taskPriorities, required: true, default: "MEDIUM" },
    status: { type: String, enum: taskStatuses, required: true, default: "TODO", index: true },
    revisionRound: { type: Number, required: true, default: 0 },
    baseRate: { type: Number, required: true, default: 0 },
    bonusAmount: { type: Number, required: true, default: 0 },
    dueDate: { type: Date },
    submittedAt: { type: Date },
    mangakaApprovedAt: { type: Date },
    editorApprovedAt: { type: Date }
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ seriesId: 1, status: 1 });
taskSchema.index({ pageId: 1, createdAt: -1 });

export const TaskModel = mongoose.model<TaskDocument>("Task", taskSchema);
