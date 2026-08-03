type ReadableNotification = {
  id: string;
  readAt?: string;
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
