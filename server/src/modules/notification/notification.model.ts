import mongoose, { Document, Schema } from "mongoose";

export const notificationTypes = [
  "TASK_ASSIGNED",
  "TASK_SUBMITTED",
  "TASK_APPROVED",
  "REVISION_REQUESTED",
  "EDITOR_COMMENT",
  "BOARD_DECISION",
  "RANKING_WARNING",
  "PAYROLL_CONFIRMED"
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export interface NotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: notificationTypes, required: true },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    isRead: { type: Boolean, required: true, default: false, index: true },
    link: { type: String, maxlength: 500 }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<NotificationDocument>("Notification", notificationSchema);
