import { asyncRoute, ok, AppError } from "../lib/http.js";
import { NotificationModel, RankingModel } from "../db/models.js";
import { paginated, paginationFromQuery, patchById, requireActor } from "./helpers.js";
import type { AuthedRequest } from "../types.js";

export const listNotifications = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const { page, limit, skip } = paginationFromQuery(req);
  const filter = { userId: actor.id };
  const [data, total, unreadTotal] = await Promise.all([
    NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    NotificationModel.countDocuments(filter),
    NotificationModel.countDocuments({ ...filter, readAt: null }),
  ]);

  ok(res, {
    data,
    pagination: {
      page,
      pageSize: limit,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    unreadTotal,
  });
});

export const markRead = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const notification = await NotificationModel.findOne({ id: String(req.params.id) }).lean();
  if (!notification) throw new AppError(404, "Notification not found.", "NOTIFICATION_NOT_FOUND");
  if ((notification as any).userId !== actor.id) {
    throw new AppError(403, "You do not have permission to modify this notification.", "FORBIDDEN");
  }
  ok(
    res,
    await patchById(req, NotificationModel, String(req.params.id), "notification.read", {
      readAt: new Date(),
    }),
  );
});

export const listRankings = asyncRoute(async (req: AuthedRequest, res) => {
  const filter: Record<string, any> = {};

  const querySeriesId = req.query.seriesId;
  if (querySeriesId) {
    filter.seriesId = String(querySeriesId);
  }

  // Sprint 3.1 / RANK-001 — readers only see the active batch per period;
  // older batches remain on disk for audit but are filtered out.
  filter.active = true;
  await paginated(req, res, RankingModel, filter, { period: -1, rank: 1, finalScore: -1 });
});
