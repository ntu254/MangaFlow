import { Router } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { requireAuth, type AuthVerifier } from "../auth/auth.middleware.js";
import { requireSystemRole, requireSeriesRole, type RoleAuthorizedRequest } from "../auth/rbac.middleware.js";
import { SYSTEM_ROLES, SERIES_MEMBER_ROLES } from "../../shared/constants/roles.js";
import { createManuscriptService, ManuscriptServiceError } from "./manuscript.service.js";
import type { ManuscriptRepository } from "./manuscript.repository.js";
import type { UserRepository } from "../auth/auth.service.js";
import type { SeriesRepository } from "../series/series.service.js";

export type ManuscriptRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
  manuscriptRepository: ManuscriptRepository;
};

export function createManuscriptRouter(dependencies: ManuscriptRouteDependencies) {
  const router = Router({ mergeParams: true }); // Important: mergeParams to access :seriesId
  const service = createManuscriptService(dependencies.manuscriptRepository);
  const authenticate = requireAuth(dependencies.authVerifier);
  
  const requireSystemMangaka = requireSystemRole([SYSTEM_ROLES.MANGAKA], dependencies.userRepository);
  const requireSystemEditor = requireSystemRole([SYSTEM_ROLES.EDITOR], dependencies.userRepository);
  
  const checkMember = requireSeriesRole(
    [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA, SERIES_MEMBER_ROLES.EDITOR, SERIES_MEMBER_ROLES.ASSISTANT],
    dependencies.seriesRepository
  );
  
  const checkMangakaMember = requireSeriesRole(
    [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA],
    dependencies.seriesRepository
  );

  const checkEditorMember = requireSeriesRole(
    [SERIES_MEMBER_ROLES.EDITOR],
    dependencies.seriesRepository
  );

  // Mangaka uploads a manuscript
  router.post("/", authenticate, requireSystemMangaka, checkMangakaMember, async (req, res) => {
    const user = (req as RoleAuthorizedRequest).localUser;
    const seriesId = req.params.seriesId as string;
    
    try {
      const manuscript = await service.createManuscript({
        seriesId,
        title: req.body.title,
        description: req.body.description,
        fileUrls: req.body.fileUrls
      }, user.id);
      res.status(201).json(ok(manuscript));
    } catch (error) {
      if (error instanceof ManuscriptServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  // Get series manuscripts
  router.get("/", authenticate, checkMember, async (req, res) => {
    const seriesId = req.params.seriesId as string;
    const list = await service.listBySeries(seriesId);
    res.json(ok(list));
  });

  // Get a single manuscript
  router.get("/:manuscriptId", authenticate, checkMember, async (req, res) => {
    try {
      const manuscript = await service.getById(req.params.manuscriptId as string);
      res.json(ok(manuscript));
    } catch (error) {
      if (error instanceof ManuscriptServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  // Mangaka submits
  router.patch("/:manuscriptId/submit", authenticate, requireSystemMangaka, checkMangakaMember, async (req, res) => {
    try {
      const manuscript = await service.submitManuscript(req.params.manuscriptId as string);
      res.json(ok(manuscript));
    } catch (error) {
      if (error instanceof ManuscriptServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  // Editor reviews, approves, requests revision
  router.patch("/:manuscriptId/review", authenticate, requireSystemEditor, checkEditorMember, async (req, res) => {
    try {
      const action = req.body.action; // 'start', 'approve', 'request_revision'
      const manuscriptId = req.params.manuscriptId as string;
      let manuscript;
      switch (action) {
        case "start":
          manuscript = await service.startEditorReview(manuscriptId);
          break;
        case "approve":
          manuscript = await service.approveManuscript(manuscriptId);
          break;
        case "request_revision":
          manuscript = await service.requestRevision(manuscriptId);
          break;
        default:
          res.status(400).json(fail("Invalid action", "BAD_REQUEST"));
          return;
      }
      res.json(ok(manuscript));
    } catch (error) {
      if (error instanceof ManuscriptServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  return router;
}
