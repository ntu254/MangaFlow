import { asyncRoute, ok, AppError } from "../lib/http.js";
import { NotificationModel } from "../db/models.js";
import { paginated, patchById, requireActor } from "./helpers.js";
import type { AuthedRequest } from "../types.js";

export const listNotifications = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  await paginated(
    req,
    res,
    NotificationModel,
    { userId: actor.id, archivedAt: { $exists: false } },
    { createdAt: -1 },
  );
});

export const markRead = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const notification = await NotificationModel.findOne({ id: String(req.params.id) }).lean();
  if (!notification) throw new AppError(404, "Notification not found.", "NOTIFICATION_NOT_FOUND");
  if ((notification as any).userId !== actor.id && actor.role !== "ADMIN") {
    throw new AppError(403, "You do not have permission to modify this notification.", "FORBIDDEN");
  }
  ok(
    res,
    await patchById(req, NotificationModel, String(req.params.id), "notification.read", {
      readAt: new Date(),
    }),
  );
});

export const archiveNotification = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const notification = await NotificationModel.findOne({ id: String(req.params.id) }).lean();
  if (!notification) throw new AppError(404, "Notification not found.", "NOTIFICATION_NOT_FOUND");
  if ((notification as any).userId !== actor.id && actor.role !== "ADMIN") {
    throw new AppError(403, "You do not have permission to modify this notification.", "FORBIDDEN");
  }
  ok(
    res,
    await patchById(req, NotificationModel, String(req.params.id), "notification.archive", {
      archivedAt: new Date(),
    }),
  );
});
