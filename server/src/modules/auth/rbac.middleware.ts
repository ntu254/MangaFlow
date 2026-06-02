import type { NextFunction, Request, Response } from "express";
import { fail } from "../../shared/responses/api-response.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";
import type { UserRepository, AuthUser, SystemRole } from "./auth.service.js";
import type { SeriesRepository } from "../series/series.service.js";
import type { SeriesMemberRole } from "../../shared/constants/roles.js";

export type RoleAuthorizedRequest = AuthenticatedRequest & {
  localUser: AuthUser;
  seriesRole?: SeriesMemberRole;
};

export function requireSystemRole(roles: SystemRole[], userRepository: UserRepository) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json(fail("Authentication required", "AUTH_REQUIRED"));
      return;
    }

    try {
      const user = await userRepository.findByClerkId(req.auth.clerkId);
      if (!user) {
        res.status(401).json(fail("User not synced", "USER_NOT_SYNCED"));
        return;
      }

      if (user.status === "SUSPENDED") {
        res.status(403).json(fail("Account suspended", "FORBIDDEN"));
        return;
      }

      if (!user.systemRole || !roles.includes(user.systemRole)) {
        res.status(403).json(fail("Insufficient system role", "FORBIDDEN"));
        return;
      }

      (req as RoleAuthorizedRequest).localUser = user;
      next();
    } catch (err) {
      res.status(500).json(fail("Internal server error during authorization", "INTERNAL_ERROR"));
    }
  };
}

export function requireSeriesRole(roles: SeriesMemberRole[], seriesRepository: SeriesRepository) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const roleReq = req as RoleAuthorizedRequest;
    if (!roleReq.localUser) {
      res.status(500).json(fail("requireSeriesRole must be used after requireSystemRole", "INTERNAL_ERROR"));
      return;
    }

    const seriesId = req.params.seriesId;
    if (!seriesId || typeof seriesId !== "string") {
      res.status(400).json(fail("Series ID parameter missing or invalid", "BAD_REQUEST"));
      return;
    }

    try {
      const role = await seriesRepository.getSeriesMemberRole(seriesId, roleReq.localUser.id);
      if (!role || !roles.includes(role as SeriesMemberRole)) {
        res.status(403).json(fail("Insufficient series role", "FORBIDDEN"));
        return;
      }

      roleReq.seriesRole = role as SeriesMemberRole;
      next();
    } catch (err) {
      res.status(500).json(fail("Internal server error during series authorization", "INTERNAL_ERROR"));
    }
  };
}
