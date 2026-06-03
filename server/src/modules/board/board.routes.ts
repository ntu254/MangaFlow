import { Router } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { requireAuth, type AuthVerifier } from "../auth/auth.middleware.js";
import { requireSystemRole, type RoleAuthorizedRequest } from "../auth/rbac.middleware.js";
import { SYSTEM_ROLES } from "../../shared/constants/roles.js";
import type { UserRepository } from "../auth/auth.service.js";
import { BoardServiceError, type BoardService } from "./board.service.js";
import { SeriesModel } from "../series/series.model.js";

export type BoardRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  boardService: BoardService;
};

export function createBoardRouter(dependencies: BoardRouteDependencies) {
  const router = Router({ mergeParams: true });
  const authenticate = requireAuth(dependencies.authVerifier);

  // 1. List Board Members
  router.get("/members", authenticate, requireSystemRole([SYSTEM_ROLES.BOARD, SYSTEM_ROLES.ADMIN], dependencies.userRepository), async (req, res) => {
    try {
      const members = await dependencies.boardService.listBoardMembers();
      res.json(ok(members));
    } catch (error) {
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // 2. Submit/Update Vote
  router.post("/:seriesId/votes", authenticate, requireSystemRole([SYSTEM_ROLES.BOARD, SYSTEM_ROLES.ADMIN], dependencies.userRepository), async (req, res) => {
    const user = (req as RoleAuthorizedRequest).localUser;
    const seriesId = req.params.seriesId as string;
    const { vote, reason } = req.body;
    try {
      const boardVote = await dependencies.boardService.submitVote(user.id, seriesId, vote, reason);
      res.json(ok(boardVote));
    } catch (error) {
      if (error instanceof BoardServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // 3. Get Votes list
  router.get("/:seriesId/votes", authenticate, async (req, res) => {
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
        res.status(403).json(fail("Insufficient permissions to view votes", "FORBIDDEN"));
        return;
      }

      const votes = await dependencies.boardService.getVotesBySeries(seriesId);
      res.json(ok(votes));
    } catch (error) {
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // 4. Get Vote Summary
  router.get("/:seriesId/votes/summary", authenticate, async (req, res) => {
    const seriesId = req.params.seriesId as string;
    try {
      const summary = await dependencies.boardService.getVoteSummary(seriesId);
      res.json(ok(summary));
    } catch (error) {
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // 5. Finalize Decision
  router.post("/:seriesId/decisions/finalize", authenticate, async (req, res) => {
    const authReq = req as RoleAuthorizedRequest;
    const seriesId = req.params.seriesId as string;
    try {
      const user = await dependencies.userRepository.findByClerkId(authReq.auth!.clerkId);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      const decision = await dependencies.boardService.finalizeDecision(seriesId, user.id);
      res.json(ok(decision));
    } catch (error) {
      if (error instanceof BoardServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  // 6. Tie-break Decision
  router.post("/:seriesId/decisions/tie-break", authenticate, async (req, res) => {
    const authReq = req as RoleAuthorizedRequest;
    const seriesId = req.params.seriesId as string;
    const { decision, reason } = req.body;
    try {
      const user = await dependencies.userRepository.findByClerkId(authReq.auth!.clerkId);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      const boardDecision = await dependencies.boardService.finalizeTieBreak(seriesId, user.id, decision, reason);
      res.json(ok(boardDecision));
    } catch (error) {
      if (error instanceof BoardServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      res.status(500).json(fail(error instanceof Error ? error.message : "Internal Server Error", "INTERNAL_ERROR"));
    }
  });

  return router;
}
