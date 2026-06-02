import { Router } from "express";
import {
  createClerkAuthVerifier,
  type AuthVerifier
} from "../modules/auth/auth.middleware.js";
import { createMongoUserRepository } from "../modules/auth/auth.repository.js";
import { createAuthRouter } from "../modules/auth/auth.routes.js";
import type { UserRepository } from "../modules/auth/auth.service.js";
import { createAdminRouter } from "../modules/admin/admin.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { createMongoSeriesRepository } from "../modules/series/series.repository.js";
import { createSeriesRouter } from "../modules/series/series.routes.js";
import type { SeriesRepository } from "../modules/series/series.service.js";
import { createMongoManuscriptRepository, type ManuscriptRepository } from "../modules/manuscript/manuscript.repository.js";
import { createManuscriptRouter } from "../modules/manuscript/manuscript.routes.js";
import { createMongoChapterRepository, type ChapterRepository } from "../modules/chapter/chapter.repository.js";
import { createChapterRouter } from "../modules/chapter/chapter.routes.js";
import { createMongoPageRepository, type PageRepository } from "../modules/page/page.repository.js";
import { createPageRouter } from "../modules/page/page.routes.js";
import { createMongoFileRepository, type FileRepository } from "../modules/file/file.repository.js";
import { createFileService } from "../modules/file/file.service.js";
import { createFileRouter } from "../modules/file/file.routes.js";
import { createMongoRegionRepository, type RegionRepository } from "../modules/region/region.repository.js";
import { createRegionRouter } from "../modules/region/region.routes.js";

export type ApiRouterDependencies = {
  authVerifier?: AuthVerifier;
  userRepository?: UserRepository;
  seriesRepository?: SeriesRepository;
  manuscriptRepository?: ManuscriptRepository;
  chapterRepository?: ChapterRepository;
  pageRepository?: PageRepository;
  fileRepository?: FileRepository;
  regionRepository?: RegionRepository;
};

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);

export function createApiRouter(dependencies: ApiRouterDependencies = {}) {
  const router = Router();

  router.use("/health", healthRouter);
  router.use(
    "/auth",
    createAuthRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository()
    })
  );
  router.use(
    "/admin",
    createAdminRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository()
    })
  );
  router.use(
    "/series",
    createSeriesRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository()
    })
  );
  
  router.use(
    "/series/:seriesId/manuscripts",
    createManuscriptRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      manuscriptRepository: dependencies.manuscriptRepository ?? createMongoManuscriptRepository(),
      fileRepository: dependencies.fileRepository
    })
  );

  router.use(
    "/series/:seriesId/chapters",
    createChapterRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository()
    })
  );

  router.use(
    "/chapters",
    createChapterRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository()
    })
  );

  router.use(
    "/chapters/:chapterId/pages",
    createPageRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository(),
      pageRepository: dependencies.pageRepository ?? createMongoPageRepository(),
      fileRepository: dependencies.fileRepository
    })
  );

  router.use(
    createRegionRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository(),
      pageRepository: dependencies.pageRepository ?? createMongoPageRepository(),
      regionRepository: dependencies.regionRepository ?? createMongoRegionRepository()
    })
  );

  router.use(
    "/pages",
    createPageRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      userRepository: dependencies.userRepository ?? createMongoUserRepository(),
      seriesRepository: dependencies.seriesRepository ?? createMongoSeriesRepository(),
      chapterRepository: dependencies.chapterRepository ?? createMongoChapterRepository(),
      pageRepository: dependencies.pageRepository ?? createMongoPageRepository(),
      fileRepository: dependencies.fileRepository
    })
  );

  const fileRepository = dependencies.fileRepository ?? createMongoFileRepository();
  const fileService = createFileService(fileRepository);
  router.use(
    "/files",
    createFileRouter({
      authVerifier: dependencies.authVerifier ?? createClerkAuthVerifier(),
      fileService
    })
  );

  return router;
}
