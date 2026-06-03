import { Router } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { requireAuth, type AuthVerifier } from "../auth/auth.middleware.js";
import { requireSystemRole, type RoleAuthorizedRequest } from "../auth/rbac.middleware.js";
import { SYSTEM_ROLES } from "../../shared/constants/roles.js";
import type { UserRepository } from "../auth/auth.service.js";
import { RankingServiceError, type RankingService } from "./ranking.service.js";
import { SeriesModel } from "../series/series.model.js";

export type RankingRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  rankingService: RankingService;
};

export function createRankingRouter(dependencies: RankingRouteDependencies) {
  const router = Router({ mergeParams: true });
  const authenticate = requireAuth(dependencies.authVerifier);
  const authorizeBoardOrAdmin = requireSystemRole([SYSTEM_ROLES.BOARD, SYSTEM_ROLES.ADMIN], dependencies.userRepository);

  // 1. GET /api/rankings?period=2026-W22
  router.get("/rankings", authenticate, authorizeBoardOrAdmin, async (req, res) => {
    const period = req.query.period as string;
    try {
      if (!period) {
        res.status(400).json(fail("Period query parameter is required", "PERIOD_REQUIRED"));
        return;
      }
      const rankings = await dependencies.rankingService.getRankingsByPeriod(period);
      res.json(ok(rankings));
    } catch (error) {
      if (error instanceof RankingServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // 2. POST /api/rankings/import
  router.post("/rankings/import", authenticate, authorizeBoardOrAdmin, async (req, res) => {
    const { period, items } = req.body;
    const user = (req as RoleAuthorizedRequest).localUser;
    try {
      const rankings = await dependencies.rankingService.importAndCalculateRankings(user.id, period, items);
      res.json(ok(rankings));
    } catch (error) {
      if (error instanceof RankingServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // 3. GET /api/series/:seriesId/rankings
  router.get("/series/:seriesId/rankings", authenticate, async (req, res) => {
    const authReq = req as RoleAuthorizedRequest;
    const seriesId = req.params.seriesId as string;
    try {
      const user = await dependencies.userRepository.findByClerkId(authReq.auth!.clerkId);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      let isAuthorized = user.systemRole === SYSTEM_ROLES.ADMIN || user.systemRole === SYSTEM_ROLES.BOARD;
      if (!isAuthorized) {
        const series = await SeriesModel.findById(seriesId);
        if (series && String(series.ownerId) === user.id) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        res.status(403).json(fail("Insufficient permissions to view series rankings", "FORBIDDEN"));
        return;
      }

      const rankings = await dependencies.rankingService.getSeriesRankings(seriesId);
      res.json(ok(rankings));
    } catch (error) {
      if (error instanceof RankingServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // 4. POST /api/rankings/:rankingId/mark-warning
  router.post("/rankings/:rankingId/mark-warning", authenticate, authorizeBoardOrAdmin, async (req, res) => {
    const rankingId = req.params.rankingId as string;
    try {
      const ranking = await dependencies.rankingService.updateStatus(rankingId, "WARNING");
      res.json(ok(ranking));
    } catch (error) {
      if (error instanceof RankingServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // 5. POST /api/rankings/:rankingId/mark-at-risk
  router.post("/rankings/:rankingId/mark-at-risk", authenticate, authorizeBoardOrAdmin, async (req, res) => {
    const rankingId = req.params.rankingId as string;
    try {
      const ranking = await dependencies.rankingService.updateStatus(rankingId, "AT_RISK");
      res.json(ok(ranking));
    } catch (error) {
      if (error instanceof RankingServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  return router;
}
