import { markNotificationReadInList } from "@/shared/lib/notification-cache";
import type { NotificationListResponse } from "@/shared/api/services";

type ListItem = { id: string; readAt?: string };

/**
 * `GET /notifications` returns a paginated envelope. Older builds (and cached
 * query data written by them) hold a bare array, so both shapes are accepted.
 */
export type NotificationListPayload<T> = NotificationListResponse<T> | T[];

export function selectNotificationItems<T>(payload: NotificationListPayload<T> | undefined): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.data) ? payload.data : [];
}

/**
 * The badge must reflect every unread notification, not just the ones on the
 * loaded page — so the server count wins whenever it is present.
 */
export function selectUnreadTotal<T extends ListItem>(
  payload: NotificationListPayload<T> | undefined,
): number {
  if (!payload) return 0;
  if (!Array.isArray(payload) && typeof payload.unreadTotal === "number") {
    return payload.unreadTotal;
  }
  return selectNotificationItems(payload).filter((item) => !item.readAt).length;
}

function countNewlyRead<T extends ListItem>(items: T[], readIds: string[]): number {
  return items.filter((item) => readIds.includes(item.id) && !item.readAt).length;
}

export function markNotificationsReadInResponse<T extends ListItem>(
  payload: NotificationListPayload<T> | undefined,
  notificationIds: string[],
  readAt = new Date().toISOString(),
): NotificationListPayload<T> | undefined {
  if (!payload) return payload;

  const items = selectNotificationItems(payload);
  const newlyRead = countNewlyRead(items, notificationIds);
  const nextItems = notificationIds.reduce(
    (acc, id) => markNotificationReadInList(acc, id, readAt),
    items,
  );

  if (Array.isArray(payload)) return nextItems;

  return {
    ...payload,
    data: nextItems,
    unreadTotal: Math.max(0, selectUnreadTotal(payload) - newlyRead),
  };
}

export function markNotificationReadInResponse<T extends ListItem>(
  payload: NotificationListPayload<T> | undefined,
  notificationId: string,
  readAt = new Date().toISOString(),
): NotificationListPayload<T> | undefined {
  return markNotificationsReadInResponse(payload, [notificationId], readAt);
}
