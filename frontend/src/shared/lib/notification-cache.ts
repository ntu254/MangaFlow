type ReadableNotification = {
  id: string;
  readAt?: string;
  archivedAt?: string;
};

export function markNotificationReadInList<T extends ReadableNotification>(
  notifications: T[],
  notificationId: string,
  readAt = new Date().toISOString(),
): T[] {
  return notifications.map((notification) =>
    notification.id === notificationId && !notification.readAt
      ? { ...notification, readAt }
      : notification,
  );
}

export function markNotificationArchivedInList<T extends ReadableNotification>(
  notifications: T[],
  notificationId: string,
  archivedAt = new Date().toISOString(),
): T[] {
  return notifications.map((notification) =>
    notification.id === notificationId && !notification.archivedAt
      ? { ...notification, archivedAt }
      : notification,
  );
}
