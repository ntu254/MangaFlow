import { Router, type Response } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { SYSTEM_ROLES, SERIES_MEMBER_ROLES } from "../../shared/constants/roles.js";
import { requireAuth, type AuthenticatedRequest, type AuthVerifier } from "../auth/auth.middleware.js";
import type { UserRepository } from "../auth/auth.service.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { PageRepository } from "../page/page.repository.js";
import type { SeriesRepository } from "../series/series.service.js";
import { createRegionService, RegionServiceError } from "./region.service.js";
import type { RegionRepository } from "./region.repository.js";

export type RegionRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
  chapterRepository: ChapterRepository;
  pageRepository: PageRepository;
  regionRepository: RegionRepository;
};

const writeSeriesRoles = [
  SERIES_MEMBER_ROLES.OWNER_MANGAKA,
  SERIES_MEMBER_ROLES.CO_MANGAKA,
  SERIES_MEMBER_ROLES.EDITOR
] as const;

function getUserId(req: AuthenticatedRequest) {
  return req.user!.id;
}

async function resolvePageScope(dependencies: RegionRouteDependencies, pageId: string) {
  const page = await dependencies.pageRepository.findById(pageId);
  if (!page) {
    return null;
  }
  const chapter = await dependencies.chapterRepository.findById(page.chapterId);
  if (!chapter) {
    return null;
  }
  return { page, chapter };
}

async function resolveAuthorizedUser(dependencies: RegionRouteDependencies, userId: string) {
  return dependencies.userRepository.findById(userId);
}

async function assertReadAccess(dependencies: RegionRouteDependencies, userId: string, seriesId: string) {
  const user = await resolveAuthorizedUser(dependencies, userId);
  if (!user) {
    throw new RegionServiceError("USER_NOT_SYNCED", "User not synced", 401);
  }
  if (user.status === "SUSPENDED") {
    throw new RegionServiceError("FORBIDDEN", "Account suspended", 403);
  }
  if (user.systemRole === SYSTEM_ROLES.ADMIN) {
    return user;
  }
  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  if (!role) {
    throw new RegionServiceError("FORBIDDEN", "Insufficient series role", 403);
  }
  return user;
}

async function assertWriteAccess(dependencies: RegionRouteDependencies, userId: string, seriesId: string) {
  const user = await resolveAuthorizedUser(dependencies, userId);
  if (!user) {
    throw new RegionServiceError("USER_NOT_SYNCED", "User not synced", 401);
  }
  if (user.status === "SUSPENDED") {
    throw new RegionServiceError("FORBIDDEN", "Account suspended", 403);
  }
  if (user.systemRole === SYSTEM_ROLES.ADMIN) {
    return user;
  }
  if (![SYSTEM_ROLES.MANGAKA, SYSTEM_ROLES.EDITOR].includes(user.systemRole as any)) {
    throw new RegionServiceError("FORBIDDEN", "Insufficient system role", 403);
  }

  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  if (!role || !writeSeriesRoles.includes(role as any)) {
    throw new RegionServiceError("FORBIDDEN", "Insufficient series role", 403);
  }
  return user;
}

function sendRegionError(res: Response, error: unknown) {
  if (error instanceof RegionServiceError) {
    res.status(error.statusCode).json(fail(error.message, error.code));
    return;
  }
  res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
}

export function createRegionRouter(dependencies: RegionRouteDependencies) {
  const router = Router({ mergeParams: true });
  const authenticate = requireAuth(dependencies.authVerifier);
  const service = createRegionService(dependencies.regionRepository);

  router.get("/pages/:pageId/regions", authenticate, async (req, res) => {
    try {
      const scope = await resolvePageScope(dependencies, req.params.pageId as string);
      if (!scope) {
        res.status(404).json(fail("Page not found", "NOT_FOUND"));
        return;
      }
      await assertReadAccess(dependencies, getUserId(req as AuthenticatedRequest), scope.chapter.seriesId);
      const regions = await service.listByPage(scope.page.id);
      res.json(ok(regions));
    } catch (error) {
      sendRegionError(res, error);
    }
  });

  router.post("/pages/:pageId/regions", authenticate, async (req, res) => {
    try {
      const scope = await resolvePageScope(dependencies, req.params.pageId as string);
      if (!scope) {
        res.status(404).json(fail("Page not found", "NOT_FOUND"));
        return;
      }
      const user = await assertWriteAccess(dependencies, getUserId(req as AuthenticatedRequest), scope.chapter.seriesId);
      const region = await service.createRegion({
        pageId: scope.page.id,
        taskId: req.body.taskId,
        type: req.body.type,
        source: req.body.source,
        shape: req.body.shape,
        x: Number(req.body.x),
        y: Number(req.body.y),
        width: Number(req.body.width),
        height: Number(req.body.height),
        confidence: req.body.confidence === undefined ? undefined : Number(req.body.confidence),
        createdBy: user.id
      });
      res.status(201).json(ok(region));
    } catch (error) {
      sendRegionError(res, error);
    }
  });

  router.get("/regions/:regionId", authenticate, async (req, res) => {
    try {
      const region = await service.getById(req.params.regionId as string);
      const scope = await resolvePageScope(dependencies, region.pageId);
      if (!scope) {
        res.status(404).json(fail("Page not found", "NOT_FOUND"));
        return;
      }
      await assertReadAccess(dependencies, getUserId(req as AuthenticatedRequest), scope.chapter.seriesId);
      res.json(ok(region));
    } catch (error) {
      sendRegionError(res, error);
    }
  });

  router.patch("/regions/:regionId", authenticate, async (req, res) => {
    try {
      const current = await service.getById(req.params.regionId as string);
      const scope = await resolvePageScope(dependencies, current.pageId);
      if (!scope) {
        res.status(404).json(fail("Page not found", "NOT_FOUND"));
        return;
      }
      await assertWriteAccess(dependencies, getUserId(req as AuthenticatedRequest), scope.chapter.seriesId);
      const updated = await service.updateRegion(current.id, {
        taskId: req.body.taskId,
        type: req.body.type,
        source: req.body.source,
        shape: req.body.shape,
        x: req.body.x === undefined ? undefined : Number(req.body.x),
        y: req.body.y === undefined ? undefined : Number(req.body.y),
        width: req.body.width === undefined ? undefined : Number(req.body.width),
        height: req.body.height === undefined ? undefined : Number(req.body.height),
        confidence: req.body.confidence === undefined ? undefined : Number(req.body.confidence)
      });
      res.json(ok(updated));
    } catch (error) {
      sendRegionError(res, error);
    }
  });

  router.delete("/regions/:regionId", authenticate, async (req, res) => {
    try {
      const current = await service.getById(req.params.regionId as string);
      const scope = await resolvePageScope(dependencies, current.pageId);
      if (!scope) {
        res.status(404).json(fail("Page not found", "NOT_FOUND"));
        return;
      }
      await assertWriteAccess(dependencies, getUserId(req as AuthenticatedRequest), scope.chapter.seriesId);
      const deleted = await service.deleteRegion(current.id);
      res.json(ok({ deleted }));
    } catch (error) {
      sendRegionError(res, error);
    }
  });

  return router;
}
