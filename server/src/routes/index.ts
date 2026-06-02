import { Router } from "express";
import {
  createClerkAuthVerifier,
  type AuthVerifier
} from "../modules/auth/auth.middleware.js";
import { createMongoUserRepository } from "../modules/auth/auth.repository.js";
import { createAuthRouter } from "../modules/auth/auth.routes.js";
import type { UserRepository } from "../modules/auth/auth.service.js";
import { healthRouter } from "../modules/health/health.routes.js";

export type ApiRouterDependencies = {
  authVerifier?: AuthVerifier;
  userRepository?: UserRepository;
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

  return router;
}
