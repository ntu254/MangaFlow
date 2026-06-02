import { Router } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { requireAuth, type AuthVerifier } from "../auth/auth.middleware.js";
import { requireSystemRole, requireSeriesRole, type RoleAuthorizedRequest } from "../auth/rbac.middleware.js";
import { SYSTEM_ROLES, SERIES_MEMBER_ROLES } from "../../shared/constants/roles.js";
import { createChapterService, ChapterServiceError } from "./chapter.service.js";
import type { ChapterRepository } from "./chapter.repository.js";
import type { UserRepository } from "../auth/auth.service.js";
import type { SeriesRepository } from "../series/series.service.js";

export type ChapterRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
  chapterRepository: ChapterRepository;
};

export function createChapterRouter(dependencies: ChapterRouteDependencies) {
  const router = Router({ mergeParams: true });
  const service = createChapterService(dependencies.chapterRepository);
  const authenticate = requireAuth(dependencies.authVerifier);

  const requireSystemMangaka = requireSystemRole([SYSTEM_ROLES.MANGAKA], dependencies.userRepository);
  const requireSystemEditor = requireSystemRole([SYSTEM_ROLES.EDITOR], dependencies.userRepository);
  const requireSystemSeriesParticipant = requireSystemRole(
    [SYSTEM_ROLES.MANGAKA, SYSTEM_ROLES.ASSISTANT, SYSTEM_ROLES.EDITOR],
    dependencies.userRepository
  );
  
  const checkMember = requireSeriesRole(
    [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA, SERIES_MEMBER_ROLES.EDITOR, SERIES_MEMBER_ROLES.ASSISTANT],
    dependencies.seriesRepository
  );

  const checkMangakaMember = requireSeriesRole(
    [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA],
    dependencies.seriesRepository
  );

  // POST /api/series/:seriesId/chapters
  router.post("/", authenticate, requireSystemMangaka, checkMangakaMember, async (req, res) => {
    const seriesId = req.params.seriesId as string;
    try {
      const chapter = await service.createChapter({
        seriesId,
        title: req.body.title,
        chapterNumber: Number(req.body.chapterNumber),
        deadline: req.body.deadline
      });
      res.status(201).json(ok(chapter));
    } catch (error) {
      if (error instanceof ChapterServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  // GET /api/series/:seriesId/chapters
  router.get("/", authenticate, requireSystemSeriesParticipant, checkMember, async (req, res) => {
    const seriesId = req.params.seriesId as string;
    try {
      const list = await service.listBySeries(seriesId);
      res.json(ok(list));
    } catch (error) {
      throw error;
    }
  });

  // GET /api/chapters/:chapterId
  // (Note: this route is registered directly on /api/chapters/:chapterId in the main index)
  router.get("/:chapterId", authenticate, async (req, res) => {
    try {
      const chapter = await service.getById(req.params.chapterId as string);
      
      // Load user and check series membership
      const authReq = req as RoleAuthorizedRequest;
      const user = await dependencies.userRepository.findByClerkId(authReq.auth!.clerkId);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      if (user.systemRole === SYSTEM_ROLES.ADMIN) {
        res.json(ok(chapter));
        return;
      }

      const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user.id);
      if (!role) {
        res.status(403).json(fail("Insufficient series role", "FORBIDDEN"));
        return;
      }

      res.json(ok(chapter));
    } catch (error) {
      if (error instanceof ChapterServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  // PATCH /api/chapters/:chapterId
  router.patch("/:chapterId", authenticate, async (req, res) => {
    try {
      const chapterId = req.params.chapterId as string;
      const chapter = await service.getById(chapterId);

      const authReq = req as RoleAuthorizedRequest;
      const user = await dependencies.userRepository.findByClerkId(authReq.auth!.clerkId);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user.id);
        const allowedRoles = [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA, SERIES_MEMBER_ROLES.EDITOR];
        if (!role || !allowedRoles.includes(role as any)) {
          res.status(403).json(fail("Insufficient role to update chapter", "FORBIDDEN"));
          return;
        }
      }

      const updated = await service.updateChapter(chapterId, {
        title: req.body.title,
        chapterNumber: req.body.chapterNumber !== undefined ? Number(req.body.chapterNumber) : undefined,
        status: req.body.status,
        deadline: req.body.deadline
      });

      res.json(ok(updated));
    } catch (error) {
      if (error instanceof ChapterServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  // DELETE /api/chapters/:chapterId
  router.delete("/:chapterId", authenticate, async (req, res) => {
    try {
      const chapterId = req.params.chapterId as string;
      const chapter = await service.getById(chapterId);

      const authReq = req as RoleAuthorizedRequest;
      const user = await dependencies.userRepository.findByClerkId(authReq.auth!.clerkId);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user.id);
        const allowedRoles = [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA];
        if (!role || !allowedRoles.includes(role as any)) {
          res.status(403).json(fail("Only Mangaka owners can delete chapters", "FORBIDDEN"));
          return;
        }
      }

      const deleted = await service.deleteChapter(chapterId);
      res.json(ok({ deleted }));
    } catch (error) {
      if (error instanceof ChapterServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  return router;
}
