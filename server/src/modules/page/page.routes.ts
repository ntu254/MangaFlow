import { Router } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { requireAuth, type AuthVerifier } from "../auth/auth.middleware.js";
import { requireSystemRole, type RoleAuthorizedRequest } from "../auth/rbac.middleware.js";
import { SYSTEM_ROLES, SERIES_MEMBER_ROLES } from "../../shared/constants/roles.js";
import { createPageService, PageServiceError } from "./page.service.js";
import type { PageRepository } from "./page.repository.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { UserRepository } from "../auth/auth.service.js";
import type { SeriesRepository } from "../series/series.service.js";

export type PageRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
  chapterRepository: ChapterRepository;
  pageRepository: PageRepository;
};

export function createPageRouter(dependencies: PageRouteDependencies) {
  const router = Router({ mergeParams: true });
  const service = createPageService(dependencies.pageRepository);
  const authenticate = requireAuth(dependencies.authVerifier);
  
  const requireSystemMangaka = requireSystemRole([SYSTEM_ROLES.MANGAKA], dependencies.userRepository);

  // POST /api/chapters/:chapterId/pages
  router.post("/", authenticate, requireSystemMangaka, async (req, res) => {
    try {
      const chapterId = req.params.chapterId as string;
      const chapter = await dependencies.chapterRepository.findById(chapterId);
      if (!chapter) {
        res.status(404).json(fail("Chapter not found", "NOT_FOUND"));
        return;
      }

      const authReq = req as RoleAuthorizedRequest;
      const user = authReq.localUser;

      // Check series role (Mangaka creator)
      const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user.id);
      const allowedRoles = [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA];
      if (!role || !allowedRoles.includes(role as any)) {
        res.status(403).json(fail("Insufficient series role to upload pages", "FORBIDDEN"));
        return;
      }

      const page = await service.createPage({
        chapterId,
        pageNumber: Number(req.body.pageNumber),
        originalFileUrl: req.body.originalFileUrl,
        previewUrl: req.body.previewUrl ?? req.body.originalFileUrl,
        thumbnailUrl: req.body.thumbnailUrl ?? req.body.originalFileUrl,
        width: req.body.width !== undefined ? Number(req.body.width) : undefined,
        height: req.body.height !== undefined ? Number(req.body.height) : undefined
      });

      res.status(201).json(ok(page));
    } catch (error) {
      if (error instanceof PageServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  // GET /api/chapters/:chapterId/pages
  router.get("/", authenticate, async (req, res) => {
    try {
      const chapterId = req.params.chapterId as string;
      const chapter = await dependencies.chapterRepository.findById(chapterId);
      if (!chapter) {
        res.status(404).json(fail("Chapter not found", "NOT_FOUND"));
        return;
      }

      const authReq = req as RoleAuthorizedRequest;
      const user = await dependencies.userRepository.findByClerkId(authReq.auth!.clerkId);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user.id);
        if (!role) {
          res.status(403).json(fail("Insufficient series role to view pages", "FORBIDDEN"));
          return;
        }
      }

      const list = await service.listByChapter(chapterId);
      res.json(ok(list));
    } catch (error) {
      throw error;
    }
  });

  // GET /api/pages/:pageId
  router.get("/:pageId", authenticate, async (req, res) => {
    try {
      const pageId = req.params.pageId as string;
      const page = await service.getById(pageId);
      const chapter = await dependencies.chapterRepository.findById(page.chapterId);
      if (!chapter) {
        res.status(404).json(fail("Associated chapter not found", "NOT_FOUND"));
        return;
      }

      const authReq = req as RoleAuthorizedRequest;
      const user = await dependencies.userRepository.findByClerkId(authReq.auth!.clerkId);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      if (user.systemRole !== SYSTEM_ROLES.ADMIN) {
        const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user.id);
        if (!role) {
          res.status(403).json(fail("Insufficient series role to view page", "FORBIDDEN"));
          return;
        }
      }

      res.json(ok(page));
    } catch (error) {
      if (error instanceof PageServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  // DELETE /api/pages/:pageId
  router.delete("/:pageId", authenticate, requireSystemMangaka, async (req, res) => {
    try {
      const pageId = req.params.pageId as string;
      const page = await service.getById(pageId);
      const chapter = await dependencies.chapterRepository.findById(page.chapterId);
      if (!chapter) {
        res.status(404).json(fail("Associated chapter not found", "NOT_FOUND"));
        return;
      }

      const authReq = req as RoleAuthorizedRequest;
      const user = authReq.localUser;

      const role = await dependencies.seriesRepository.getSeriesMemberRole(chapter.seriesId, user.id);
      const allowedRoles = [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA];
      if (!role || !allowedRoles.includes(role as any)) {
        res.status(403).json(fail("Only Mangaka owners can delete pages", "FORBIDDEN"));
        return;
      }

      const deleted = await service.deletePage(pageId);
      res.json(ok({ deleted }));
    } catch (error) {
      if (error instanceof PageServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  return router;
}
