import { asyncRoute, ok } from "../../../lib/http.js";
import { paginated } from "../../../controllers/helpers.js";
import type { AuthedRequest } from "../../../types.js";
import {
  archiveNotification as archiveNotificationCommand,
  markNotificationRead,
  notificationListFilter,
  notificationModel,
} from "../application/notification.service.js";

export const listNotifications = asyncRoute(async (req: AuthedRequest, res) => {
  await paginated(req, res, notificationModel(), notificationListFilter(req), { createdAt: -1 });
});

export const markRead = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await markNotificationRead(req, String(req.params.id)));
});

export const archiveNotification = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await archiveNotificationCommand(req, String(req.params.id)));
});
