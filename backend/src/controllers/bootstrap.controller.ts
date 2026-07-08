import { asyncRoute, ok } from "../lib/http.js";
import { apiToWebRole } from "../domain/roles.js";
import { NotificationModel } from "../db/models.js";
import { dashboardSummary } from "../services/workflow.service.js";
import { requireActor } from "./helpers.js";
import type { AuthedRequest } from "../types.js";

export const bootstrapHandler = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const role = apiToWebRole[actor.role];
  const unreadNotifications = await NotificationModel.countDocuments({ userId: actor.id, readAt: { $exists: false }, archivedAt: { $exists: false } });
  ok(res, {
    user: actor,
    navRole: role,
    unreadNotifications,
    dashboardSummary: await dashboardSummary(role),
    featureFlags: {
      liveBackend: true,
      aiBridge: true,
      r2SignedUrls: false
    }
  });
});

export const dashboardSummaryHandler = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await dashboardSummary(String(req.params.role)));
});
