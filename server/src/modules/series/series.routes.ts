import { Router } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import { requireAuth, type AuthVerifier } from "../auth/auth.middleware.js";
import { requireSystemRole, requireSeriesRole, type RoleAuthorizedRequest } from "../auth/rbac.middleware.js";
import { SYSTEM_ROLES, SERIES_MEMBER_ROLES } from "../../shared/constants/roles.js";
import { createSeriesService, SeriesServiceError, type SeriesRepository, type UpdateSeriesInput } from "./series.service.js";
import type { UserRepository } from "../auth/auth.service.js";

export type SeriesRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  seriesRepository: SeriesRepository;
};

export function createSeriesRouter(dependencies: SeriesRouteDependencies) {
  const router = Router();
  const service = createSeriesService(dependencies.seriesRepository);
  const authenticate = requireAuth(dependencies.authVerifier);
  const checkMangaka = requireSystemRole([SYSTEM_ROLES.MANGAKA], dependencies.userRepository);
  const checkOwner = requireSeriesRole([SERIES_MEMBER_ROLES.OWNER_MANGAKA], dependencies.seriesRepository);
  const checkMember = requireSeriesRole(
    [SERIES_MEMBER_ROLES.OWNER_MANGAKA, SERIES_MEMBER_ROLES.CO_MANGAKA, SERIES_MEMBER_ROLES.EDITOR, SERIES_MEMBER_ROLES.ASSISTANT], 
    dependencies.seriesRepository
  );

  router.post("/", authenticate, checkMangaka, async (req, res) => {
    const user = (req as RoleAuthorizedRequest).localUser;

    try {
      const series = await service.createSeries({
        title: req.body.title,
        description: req.body.description,
        genre: req.body.genre,
        publicationType: req.body.publicationType,
        ownerId: user.id
      });
      res.status(201).json(ok(series));
    } catch (error) {
      if (error instanceof SeriesServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  router.get("/", authenticate, checkMangaka, async (req, res) => {
    const user = (req as RoleAuthorizedRequest).localUser;
    const list = await service.listUserSeries(user.id);
    res.json(ok(list));
  });

  router.get("/:seriesId", authenticate, checkMangaka, checkMember, async (req, res) => {
    try {
      const series = await service.getSeriesById(req.params.seriesId as string);
      res.json(ok(series));
    } catch (error) {
      if (error instanceof SeriesServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  router.patch("/:seriesId", authenticate, checkMangaka, checkOwner, async (req, res) => {
    try {
      const input: UpdateSeriesInput = {
        title: req.body.title,
        description: req.body.description,
        genre: req.body.genre,
        publicationType: req.body.publicationType,
        status: req.body.status
      };
      const updated = await service.updateSeries(req.params.seriesId as string, input);
      res.json(ok(updated));
    } catch (error) {
      if (error instanceof SeriesServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  router.delete("/:seriesId", authenticate, checkMangaka, checkOwner, async (req, res) => {
    const user = (req as RoleAuthorizedRequest).localUser;

    try {
      await service.deleteSeries(req.params.seriesId as string, user.id);
      res.json(ok({ success: true }));
    } catch (error) {
      if (error instanceof SeriesServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  return router;
}
