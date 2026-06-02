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

export type ApiRouterDependencies = {
  authVerifier?: AuthVerifier;
  userRepository?: UserRepository;
  seriesRepository?: SeriesRepository;
  manuscriptRepository?: ManuscriptRepository;
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
      manuscriptRepository: dependencies.manuscriptRepository ?? createMongoManuscriptRepository()
    })
  );

  return router;
}
