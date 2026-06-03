import type { NextFunction, Request, Response } from "express";
import { fail } from "../../shared/responses/api-response.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository } from "./auth.service.js";
import type { SeriesRepository } from "../series/series.service.js";
import type { SeriesMemberRole } from "../../shared/constants/roles.js";

export type RoleAuthorizedRequest = AuthenticatedRequest & {
  localUser?: AuthUser;
  seriesRole?: SeriesMemberRole;
};

export function requireSystemRole(roles: SystemRole[], userRepository?: UserRepository) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json(fail("Authentication required", "AUTH_REQUIRED"));
      return;
    }

    if (req.user.status !== "ACTIVE") {
      res.status(403).json(fail("Account is not active", "FORBIDDEN"));
      return;
    }

    if (!req.user.systemRole || !roles.includes(req.user.systemRole as SystemRole)) {
      res.status(403).json(fail("Insufficient system role", "FORBIDDEN"));
      return;
    }

    if (userRepository) {
      try {
        const user = await userRepository.findById(req.user.id);
        if (!user) {
          res.status(401).json(fail("User not found in database", "USER_NOT_SYNCED"));
          return;
        }
        (req as RoleAuthorizedRequest).localUser = user;
      } catch {
        res.status(500).json(fail("Failed to verify user in database", "INTERNAL_ERROR"));
        return;
      }
    }

    next();
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
