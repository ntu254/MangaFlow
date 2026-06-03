import type { NotificationType } from "./notification.model.js";
import { NotificationModel } from "./notification.model.js";

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>;
  listByUser(userId: string, opts?: { limit?: number; skip?: number }): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markRead(id: string, userId: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<void>;
  delete(id: string, userId: string): Promise<boolean>;
}

function toNotification(doc: any): Notification {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    isRead: doc.isRead,
    link: doc.link,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt
  };
}

export function createMongoNotificationRepository(): NotificationRepository {
  return {
    async create(data) {
      const doc = await NotificationModel.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link
      });
      return toNotification(doc);
    },

    async listByUser(userId, opts = {}) {
      const { limit = 30, skip = 0 } = opts;
      const docs = await NotificationModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      return docs.map(toNotification);
    },

    async countUnread(userId) {
      return NotificationModel.countDocuments({ userId, isRead: false });
    },

    async markRead(id, userId) {
      const doc = await NotificationModel.findOneAndUpdate(
        { _id: id, userId },
        { $set: { isRead: true } },
        { returnDocument: "after" }
      );
      return doc ? toNotification(doc) : null;
    },

    async markAllRead(userId) {
      await NotificationModel.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
    },

    async delete(id, userId) {
      const result = await NotificationModel.deleteOne({ _id: id, userId });
      return result.deletedCount > 0;
    }
  };
}
