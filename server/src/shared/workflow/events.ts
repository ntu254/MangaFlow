import mongoose, { Schema, type Document } from "mongoose"
import type { UserRole } from "../../modules/auth/auth.types.js"
import { User } from "../../modules/auth/auth.model.js"

export interface NotificationDocument extends Document {
  userId: mongoose.Types.ObjectId
  event: string
  title: string
  message: string
  link?: string
  isRead: boolean
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    event: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    link: { type: String, trim: true, maxlength: 500 },
    isRead: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
)

export const Notification = mongoose.model<NotificationDocument>("Notification", notificationSchema)

export interface AuditLogDocument extends Document {
  event: string
  actorId?: mongoose.Types.ObjectId
  entityType: string
  entityId: mongoose.Types.ObjectId
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    event: { type: String, required: true, trim: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    entityType: { type: String, required: true, trim: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
)

export const AuditLog = mongoose.model<AuditLogDocument>("AuditLog", auditLogSchema)

function canWriteEvents() {
  return mongoose.connection.readyState === 1
}

export async function recordAuditLog(input: {
  event: string
  actorId?: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}) {
  if (!canWriteEvents()) return null
  return AuditLog.create(input)
}

export async function notifyUsers(userIds: string[], input: {
  event: string
  title: string
  message: string
  link?: string
}) {
  if (!canWriteEvents() || userIds.length === 0) return []
  return Notification.insertMany(userIds.map((userId) => ({
    userId,
    event: input.event,
    title: input.title,
    message: input.message,
    link: input.link,
  })))
}

export async function notifyRole(role: UserRole, input: {
  event: string
  title: string
  message: string
  link?: string
}) {
  if (!canWriteEvents()) return []
  const users = await User.find({ role, isActive: true }).select("_id").lean()
  return notifyUsers(users.map((user) => String(user._id)), input)
}
