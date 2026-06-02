import { Router, type Response } from "express";
import { fail, ok } from "../../shared/responses/api-response.js";
import {
  requireAuth,
  type AuthenticatedRequest,
  type AuthVerifier
} from "../auth/auth.middleware.js";
import type { UserRepository, UserStatus } from "../auth/auth.service.js";
import {
  AdminRoleAssignmentError,
  createRoleAssignmentService
} from "./role-assignment.service.js";

export type AdminRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
};

function handleAdminError(res: Response, error: unknown) {
  if (error instanceof AdminRoleAssignmentError) {
    res.status(error.statusCode).json(fail(error.message, error.code));
    return true;
  }

  return false;
}

function getRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function createAdminRouter(dependencies: AdminRouteDependencies) {
  const router = Router();
  const authenticate = requireAuth(dependencies.authVerifier);
  const service = createRoleAssignmentService(dependencies.userRepository);

  async function getActor(req: AuthenticatedRequest) {
    const profile = req.auth;
    if (!profile) {
      return null;
    }

    return dependencies.userRepository.findByClerkId(profile.clerkId);
  }

  router.get("/users", authenticate, async (req, res) => {
    const actor = await getActor(req as AuthenticatedRequest);
    if (!actor) {
      res.status(403).json(fail("Admin role is required", "ADMIN_REQUIRED"));
      return;
    }

    try {
      const role = req.query.role === "pending" ? "pending" : undefined;
      const status =
        typeof req.query.status === "string"
          ? (req.query.status as UserStatus)
          : undefined;
      const users = await service.listUsersForRoleReview(actor, {
        role,
        status
      });

      res.json(ok({ users }));
    } catch (error) {
      if (!handleAdminError(res, error)) {
        throw error;
      }
    }
  });

  router.patch("/users/:userId/role", authenticate, async (req, res) => {
    const actor = await getActor(req as AuthenticatedRequest);
    if (!actor) {
      res.status(403).json(fail("Admin role is required", "ADMIN_REQUIRED"));
      return;
    }

    try {
      const user = await service.assignSystemRole(
        actor,
        getRouteParam(req.params.userId) ?? "",
        req.body.systemRole
      );

      res.json(ok({ user }));
    } catch (error) {
      if (!handleAdminError(res, error)) {
        throw error;
      }
    }
  });

  router.patch("/users/:userId/status", authenticate, async (req, res) => {
    const actor = await getActor(req as AuthenticatedRequest);
    if (!actor) {
      res.status(403).json(fail("Admin role is required", "ADMIN_REQUIRED"));
      return;
    }

    try {
      const user = await service.updateUserStatus(
        actor,
        getRouteParam(req.params.userId) ?? "",
        req.body.status
      );

      res.json(ok({ user }));
    } catch (error) {
      if (!handleAdminError(res, error)) {
        throw error;
      }
    }
  });

  return router;
}
