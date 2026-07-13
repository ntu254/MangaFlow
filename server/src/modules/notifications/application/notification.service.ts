import { NotificationModel } from "../../../db/models.js";
import { AppError } from "../../../lib/http.js";
import { patchById, requireActor } from "../../../controllers/helpers.js";
import type { AuthedRequest } from "../../../types.js";

export function notificationModel() {
  return NotificationModel;
}

export function notificationListFilter(req: AuthedRequest) {
  const actor = requireActor(req);
  return { userId: actor.id, archivedAt: { $exists: false } };
}

async function assertCanMutateNotification(req: AuthedRequest, notificationId: string) {
  const actor = requireActor(req);
  const notification = await NotificationModel.findOne({ id: notificationId }).lean();
  if (!notification) throw new AppError(404, "Notification not found.", "NOTIFICATION_NOT_FOUND");
  if ((notification as any).userId !== actor.id && actor.role !== "ADMIN") {
    throw new AppError(403, "You do not have permission to modify this notification.", "FORBIDDEN");
  }
}

export async function markNotificationRead(req: AuthedRequest, notificationId: string) {
  await assertCanMutateNotification(req, notificationId);
  return patchById(req, NotificationModel, notificationId, "notification.read", {
    readAt: new Date(),
  });
}

export async function archiveNotification(req: AuthedRequest, notificationId: string) {
  await assertCanMutateNotification(req, notificationId);
  return patchById(req, NotificationModel, notificationId, "notification.archive", {
    archivedAt: new Date(),
  });
}
