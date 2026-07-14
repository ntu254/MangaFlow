import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import authRoutes from "./auth.routes.js";
import bootstrapRoutes from "./bootstrap.routes.js";
import boardRoutes from "./board.routes.js";
import proposalRoutes from "./proposal.routes.js";
import votingRoutes from "./voting.routes.js";
import seriesRoutes from "./series.routes.js";
import studioRoutes from "./studio.routes.js";
import submissionRoutes from "./submission.routes.js";
import materialRoutes from "./material.routes.js";
import adminRoutes from "./admin.routes.js";
import publicationRoutes from "./publication.routes.js";
import tantouRoutes from "./tantou.routes.js";
import notificationRoutes from "./notification.routes.js";
import mobileRoutes from "./mobile.routes.js";
import { createAiRoutes } from "./ai.routes.js";
import fileTokenRoutes from "./file-token.routes.js";
import atRiskReportRoutes from "./at-risk-report.routes.js";

export type ApiRouterOptions = {
  aiServiceUrl?: string;
};

export function createApiRouter(options: ApiRouterOptions = {}) {
  const router = Router();

  // Auth routes — mounted BEFORE requireAuth (they handle their own token validation)
  router.use(authRoutes);
  router.use(fileTokenRoutes);

  // Apply requireAuth to all following routes
  router.use(requireAuth as any);

  // Protected feature routes
  router.use(bootstrapRoutes);
  router.use(boardRoutes);
  router.use(proposalRoutes);
  router.use(votingRoutes);
  router.use(seriesRoutes);
  router.use(studioRoutes);
  router.use(submissionRoutes);
  router.use(materialRoutes);
  router.use(adminRoutes);
  router.use(publicationRoutes);
  router.use(tantouRoutes);
  router.use(atRiskReportRoutes);
  router.use(notificationRoutes);
  router.use(mobileRoutes);

  // AI routes — needs aiServiceUrl from config
  if (options.aiServiceUrl) {
    router.use(createAiRoutes(options.aiServiceUrl));
  }

  return router;
}
