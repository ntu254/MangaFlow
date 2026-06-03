import { apiBaseUrl, parseApiResponse } from "@/shared/api";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_SUBMITTED"
  | "TASK_APPROVED"
  | "REVISION_REQUESTED"
  | "EDITOR_COMMENT"
  | "BOARD_DECISION"
  | "RANKING_WARNING"
  | "PAYROLL_CONFIRMED";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
};

export async function listNotifications(
  token: string,
  opts?: { limit?: number; skip?: number }
): Promise<Notification[]> {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.skip) params.set("skip", String(opts.skip));
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${apiBaseUrl}/notifications${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await parseApiResponse<Notification[]>(res);
  return json;
}

export async function getUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${apiBaseUrl}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await parseApiResponse<{ count: number }>(res);
  return json.count;
}

export async function markNotificationRead(token: string, id: string): Promise<Notification> {
  const res = await fetch(`${apiBaseUrl}/notifications/${id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  return parseApiResponse<Notification>(res);
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl}/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  await parseApiResponse<null>(res);
}

export async function deleteNotification(token: string, id: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl}/notifications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  await parseApiResponse<{ deleted: boolean }>(res);
}
