import { Router, type Request, type Response } from "express";
import { ok, fail } from "../../shared/responses/api-response.js";
import { requireAuth, type AuthenticatedRequest, type AuthVerifier } from "../auth/auth.middleware.js";
import type { UserRepository } from "../auth/auth.service.js";
import type { NotificationService } from "./notification.service.js";
import type { NotificationRepository } from "./notification.repository.js";
import { createMongoNotificationRepository } from "./notification.repository.js";
import { createNotificationService } from "./notification.service.js";

export type NotificationRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  notificationRepository?: NotificationRepository;
  notificationService?: NotificationService;
};

export function createNotificationRouter(dependencies: NotificationRouteDependencies) {
  const router = Router();
  const svc =
    dependencies.notificationService ??
    createNotificationService(
      dependencies.notificationRepository ?? createMongoNotificationRepository()
    );

  async function resolveUserId(req: AuthenticatedRequest): Promise<string | null> {
    const clerkId = req.auth?.clerkId;
    if (!clerkId) return null;
    const user = await dependencies.userRepository.findByClerkId(clerkId);
    return user?.id ?? null;
  }

  /**
   * GET /api/notifications
   * List recent notifications for the current user (up to 30, newest first).
   */
  router.get(
    "/notifications",
    requireAuth(dependencies.authVerifier),
    async (req: Request, res: Response) => {
      try {
        const userId = await resolveUserId(req as AuthenticatedRequest);
        if (!userId) {
          res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
          return;
        }
        const limit = Math.min(Number((req.query as any).limit) || 30, 50);
        const skip = Number((req.query as any).skip) || 0;
        const notifications = await svc.listForUser(userId, { limit, skip });
        res.json(ok(notifications));
      } catch (err: any) {
        res.status(500).json(fail(err.message ?? "Internal error", "INTERNAL_ERROR"));
      }
    }
  );

  /**
   * GET /api/notifications/unread-count
   * Returns { count: number } for the current user.
   */
  router.get(
    "/notifications/unread-count",
    requireAuth(dependencies.authVerifier),
    async (req: Request, res: Response) => {
      try {
        const userId = await resolveUserId(req as AuthenticatedRequest);
        if (!userId) {
          res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
          return;
        }
        const count = await svc.countUnread(userId);
        res.json(ok({ count }));
      } catch (err: any) {
        res.status(500).json(fail(err.message ?? "Internal error", "INTERNAL_ERROR"));
      }
    }
  );

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read for the current user.
   * Must come before /:id route to avoid param conflict.
   */
  router.patch(
    "/notifications/read-all",
    requireAuth(dependencies.authVerifier),
    async (req: Request, res: Response) => {
      try {
        const userId = await resolveUserId(req as AuthenticatedRequest);
        if (!userId) {
          res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
          return;
        }
        await svc.markAllRead(userId);
        res.json(ok(null, "All notifications marked as read"));
      } catch (err: any) {
        res.status(500).json(fail(err.message ?? "Internal error", "INTERNAL_ERROR"));
      }
    }
  );

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read.
   */
  router.patch(
    "/notifications/:id/read",
    requireAuth(dependencies.authVerifier),
    async (req: Request, res: Response) => {
      try {
        const userId = await resolveUserId(req as AuthenticatedRequest);
        if (!userId) {
          res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
          return;
        }
        const notification = await svc.markRead(req.params.id as string, userId);
        if (!notification) {
          res.status(404).json(fail("Notification not found", "NOT_FOUND"));
          return;
        }
        res.json(ok(notification));
      } catch (err: any) {
        res.status(500).json(fail(err.message ?? "Internal error", "INTERNAL_ERROR"));
      }
    }
  );

  /**
   * DELETE /api/notifications/:id
   * Delete a notification owned by the current user.
   */
  router.delete(
    "/notifications/:id",
    requireAuth(dependencies.authVerifier),
    async (req: Request, res: Response) => {
      try {
        const userId = await resolveUserId(req as AuthenticatedRequest);
        if (!userId) {
          res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
          return;
        }
        const deleted = await svc.delete(req.params.id as string, userId);
        if (!deleted) {
          res.status(404).json(fail("Notification not found", "NOT_FOUND"));
          return;
        }
        res.json(ok({ deleted: true }));
      } catch (err: any) {
        res.status(500).json(fail(err.message ?? "Internal error", "INTERNAL_ERROR"));
      }
    }
  );

  return router;
}
