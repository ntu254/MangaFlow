import { Router, type Response } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { SERIES_MEMBER_ROLES, SYSTEM_ROLES } from "../../shared/constants/roles.js";
import { requireAuth, type AuthenticatedRequest, type AuthVerifier } from "../auth/auth.middleware.js";
import type { UserRepository } from "../auth/auth.service.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { PageRepository } from "../page/page.repository.js";
import type { RegionRepository } from "../region/region.repository.js";
import type { SeriesRepository } from "../series/series.service.js";
import { createAnnotationService, AnnotationServiceError, type Annotation } from "./annotation.service.js";
import type { AnnotationRepository } from "./annotation.repository.js";

export type AnnotationRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
  chapterRepository: ChapterRepository;
  pageRepository: PageRepository;
  regionRepository: RegionRepository;
  annotationRepository: AnnotationRepository;
};

const createSeriesRoles = [
  SERIES_MEMBER_ROLES.OWNER_MANGAKA,
  SERIES_MEMBER_ROLES.CO_MANGAKA,
  SERIES_MEMBER_ROLES.EDITOR
] as const;

function getClerkId(req: AuthenticatedRequest) {
  return req.auth!.clerkId;
}

async function resolvePageScope(dependencies: AnnotationRouteDependencies, pageId: string) {
  const page = await dependencies.pageRepository.findById(pageId);
  if (!page) return null;

  const chapter = await dependencies.chapterRepository.findById(page.chapterId);
  if (!chapter) return null;

  return { page, chapter };
}

async function resolveUser(dependencies: AnnotationRouteDependencies, clerkId: string) {
  const user = await dependencies.userRepository.findByClerkId(clerkId);
  if (!user) {
    throw new AnnotationServiceError("USER_NOT_SYNCED", "User not synced", 401);
  }
  if (user.status === "SUSPENDED") {
    throw new AnnotationServiceError("FORBIDDEN", "Account suspended", 403);
  }
  return user;
}

async function assertReadAccess(dependencies: AnnotationRouteDependencies, clerkId: string, seriesId: string) {
  const user = await resolveUser(dependencies, clerkId);
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return user;

  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  if (!role) {
    throw new AnnotationServiceError("FORBIDDEN", "Insufficient series role", 403);
  }
  return user;
}

async function assertCreateAccess(dependencies: AnnotationRouteDependencies, clerkId: string, seriesId: string) {
  const user = await resolveUser(dependencies, clerkId);
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return user;

  if (![SYSTEM_ROLES.MANGAKA, SYSTEM_ROLES.EDITOR].includes(user.systemRole as any)) {
    throw new AnnotationServiceError("FORBIDDEN", "Insufficient system role", 403);
  }

  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  if (!role || !createSeriesRoles.includes(role as any)) {
    throw new AnnotationServiceError("FORBIDDEN", "Insufficient series role", 403);
  }
  return user;
}

async function assertMutationAccess(
  dependencies: AnnotationRouteDependencies,
  clerkId: string,
  seriesId: string,
  annotation: Annotation
) {
  const user = await resolveUser(dependencies, clerkId);
  if (user.systemRole === SYSTEM_ROLES.ADMIN) return user;
  if (annotation.createdBy === user.id) return user;

  if (user.systemRole !== SYSTEM_ROLES.EDITOR) {
    throw new AnnotationServiceError("FORBIDDEN", "Only creator, editor, or admin can mutate annotations", 403);
  }

  const role = await dependencies.seriesRepository.getSeriesMemberRole(seriesId, user.id);
  if (role !== SERIES_MEMBER_ROLES.EDITOR) {
    throw new AnnotationServiceError("FORBIDDEN", "Insufficient series role", 403);
  }
  return user;
}

async function assertRegionOnPage(dependencies: AnnotationRouteDependencies, regionId: string | null | undefined, pageId: string) {
  if (regionId === null || regionId === undefined) return;
  const region = await dependencies.regionRepository.findById(regionId);
  if (!region) {
    throw new AnnotationServiceError("REGION_NOT_FOUND", "Region not found", 404);
  }
  if (region.pageId !== pageId) {
    throw new AnnotationServiceError("REGION_PAGE_MISMATCH", "Region does not belong to this page", 400);
  }
}

function toNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value);
}

function sendAnnotationError(res: Response, error: unknown) {
  if (error instanceof AnnotationServiceError) {
    res.status(error.statusCode).json(fail(error.message, error.code));
    return;
  }
  res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
}

export function createAnnotationRouter(dependencies: AnnotationRouteDependencies) {
  const router = Router({ mergeParams: true });
  const authenticate = requireAuth(dependencies.authVerifier);
  const service = createAnnotationService(dependencies.annotationRepository);

  router.get("/pages/:pageId/annotations", authenticate, async (req, res) => {
    try {
      const scope = await resolvePageScope(dependencies, req.params.pageId as string);
      if (!scope) {
        res.status(404).json(fail("Page not found", "NOT_FOUND"));
        return;
      }
      await assertReadAccess(dependencies, getClerkId(req as AuthenticatedRequest), scope.chapter.seriesId);
      const annotations = await service.listByPage(scope.page.id);
      res.json(ok(annotations));
    } catch (error) {
      sendAnnotationError(res, error);
    }
  });

  router.post("/pages/:pageId/annotations", authenticate, async (req, res) => {
    try {
      const scope = await resolvePageScope(dependencies, req.params.pageId as string);
      if (!scope) {
        res.status(404).json(fail("Page not found", "NOT_FOUND"));
        return;
      }
      const user = await assertCreateAccess(dependencies, getClerkId(req as AuthenticatedRequest), scope.chapter.seriesId);
      await assertRegionOnPage(dependencies, req.body.regionId, scope.page.id);

      const annotation = await service.createAnnotation({
        pageId: scope.page.id,
        createdBy: user.id,
        targetType: req.body.targetType,
        targetId: req.body.targetId,
        regionId: req.body.regionId,
        type: req.body.type,
        x: toNumber(req.body.x),
        y: toNumber(req.body.y),
        width: toNumber(req.body.width),
        height: toNumber(req.body.height),
        comment: req.body.comment,
        status: req.body.status
      });
      res.status(201).json(ok(annotation));
    } catch (error) {
      sendAnnotationError(res, error);
    }
  });

  router.get("/annotations/:annotationId", authenticate, async (req, res) => {
    try {
      const annotation = await service.getById(req.params.annotationId as string);
      const scope = await resolvePageScope(dependencies, annotation.pageId);
      if (!scope) {
        res.status(404).json(fail("Page not found", "NOT_FOUND"));
        return;
      }
      await assertReadAccess(dependencies, getClerkId(req as AuthenticatedRequest), scope.chapter.seriesId);
      res.json(ok(annotation));
    } catch (error) {
      sendAnnotationError(res, error);
    }
  });

  router.patch("/annotations/:annotationId", authenticate, async (req, res) => {
    try {
      const current = await service.getById(req.params.annotationId as string);
      const scope = await resolvePageScope(dependencies, current.pageId);
      if (!scope) {
        res.status(404).json(fail("Page not found", "NOT_FOUND"));
        return;
      }
      await assertMutationAccess(dependencies, getClerkId(req as AuthenticatedRequest), scope.chapter.seriesId, current);
      await assertRegionOnPage(dependencies, req.body.regionId, current.pageId);

      const updated = await service.updateAnnotation(current.id, {
        regionId: req.body.regionId,
        type: req.body.type,
        x: req.body.x === undefined ? undefined : toNumber(req.body.x),
        y: req.body.y === undefined ? undefined : toNumber(req.body.y),
        width: req.body.width === undefined ? undefined : toNumber(req.body.width),
        height: req.body.height === undefined ? undefined : toNumber(req.body.height),
        comment: req.body.comment,
        status: req.body.status
      });
      res.json(ok(updated));
    } catch (error) {
      sendAnnotationError(res, error);
    }
  });

  router.delete("/annotations/:annotationId", authenticate, async (req, res) => {
    try {
      const current = await service.getById(req.params.annotationId as string);
      const scope = await resolvePageScope(dependencies, current.pageId);
      if (!scope) {
        res.status(404).json(fail("Page not found", "NOT_FOUND"));
        return;
      }
      await assertMutationAccess(dependencies, getClerkId(req as AuthenticatedRequest), scope.chapter.seriesId, current);
      const deleted = await service.deleteAnnotation(current.id);
      res.json(ok({ deleted }));
    } catch (error) {
      sendAnnotationError(res, error);
    }
  });

  return router;
}
