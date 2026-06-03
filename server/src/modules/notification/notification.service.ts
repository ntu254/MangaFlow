import type { CreateNotificationData, Notification, NotificationRepository } from "./notification.repository.js";

export interface NotificationService {
  createNotification(data: CreateNotificationData): Promise<Notification>;
  listForUser(userId: string, opts?: { limit?: number; skip?: number }): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markRead(id: string, userId: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<void>;
  delete(id: string, userId: string): Promise<boolean>;
}

export function createNotificationService(repo: NotificationRepository): NotificationService {
  return {
    createNotification: (data) => repo.create(data),
    listForUser: (userId, opts) => repo.listByUser(userId, opts),
    countUnread: (userId) => repo.countUnread(userId),
    markRead: (id, userId) => repo.markRead(id, userId),
    markAllRead: (userId) => repo.markAllRead(userId),
    delete: (id, userId) => repo.delete(id, userId)
  };
}
