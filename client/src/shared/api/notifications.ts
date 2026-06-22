import { api, unwrap } from "./_client";

export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";

export interface ApiNotification {
  id: string;
  _id?: string;
  userId?: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  status: NotificationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationsResponse {
  notifications: ApiNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function normalizeNotification(notification: ApiNotification): ApiNotification {
  return {
    ...notification,
    id: notification.id ?? notification._id ?? "",
    status: notification.status ?? "UNREAD",
  };
}

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api
      .get("/notifications", { params })
      .then(unwrap<NotificationsResponse>)
      .then((data) => ({
        ...data,
        notifications: data.notifications.map(normalizeNotification),
      })),
  markRead: (notificationId: string) =>
    api
      .patch(`/notifications/${notificationId}/read`)
      .then(unwrap<ApiNotification>)
      .then(normalizeNotification),
  archive: (notificationId: string) =>
    api
      .patch(`/notifications/${notificationId}/archive`)
      .then(unwrap<ApiNotification>)
      .then(normalizeNotification),
};
