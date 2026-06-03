import { Router, type Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "../../config/env.config.js";
import { fail, ok } from "../../shared/responses/api-response.js";
import {
  requireAuth,
  type AuthenticatedRequest,
  type AuthVerifier
} from "../auth/auth.middleware.js";
import {
  systemRoleSchema,
  userStatusSchema,
  type UserRepository,
  type UserStatus
} from "../auth/auth.service.js";
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

const createUserSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  fullName: z.string().trim().min(1, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  systemRole: systemRoleSchema
});

const updateUserSchema = z.object({
  fullName: z.string().trim().min(1, "Full name cannot be empty").optional(),
  avatarUrl: z.string().url().nullable().optional()
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters")
});

export function createAdminRouter(dependencies: AdminRouteDependencies) {
  const router = Router();
  const authenticate = requireAuth(dependencies.authVerifier);
  const service = createRoleAssignmentService(dependencies.userRepository);
  const { userRepository } = dependencies;

  async function getActor(req: AuthenticatedRequest) {
    const profile = req.user;
    if (!profile) {
      return null;
    }
    if (profile.systemRole !== "ADMIN" || profile.status !== "ACTIVE") {
      return null;
    }
    const id = profile.id;
    return userRepository.findById(id);
  }

  // GET /admin/users — List all users (or filter by role review)
  router.get("/users", authenticate, async (req, res, next) => {
    try {
      const actor = await getActor(req as AuthenticatedRequest);
      if (!actor) {
        res.status(403).json(fail("Admin role is required", "ADMIN_REQUIRED"));
        return;
      }

      if (req.query.role === "pending" || req.query.status) {
        const role = req.query.role === "pending" ? "pending" : undefined;
        const status = typeof req.query.status === "string" ? (req.query.status as UserStatus) : undefined;
        const users = await service.listUsersForRoleReview(actor, { role, status });
        res.json(ok({ users }));
        return;
      }

      const users = await userRepository.listAllUsers!();
      res.json(ok({ users }));
    } catch (error) {
      if (!handleAdminError(res, error)) {
        next(error);
      }
    }
  });

  // POST /admin/users — Admin create user
  router.post("/users", authenticate, async (req, res, next) => {
    try {
      const actor = await getActor(req as AuthenticatedRequest);
      if (!actor) {
        res.status(403).json(fail("Admin role is required", "ADMIN_REQUIRED"));
        return;
      }

      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json(fail("Invalid user input data", "BAD_REQUEST"));
        return;
      }

      const { email, fullName, password, systemRole } = parsed.data;

      // Check duplicate email
      const existing = await userRepository.findByEmail!(email);
      if (existing) {
        res.status(400).json(fail("Email address already registered", "EMAIL_EXISTS"));
        return;
      }

      const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
      const user = await userRepository.createUser!({
        email,
        fullName,
        passwordHash,
        systemRole,
        status: "ACTIVE"
      });

      res.status(201).json(ok({ user }));
    } catch (error) {
      next(error);
    }
  });

  // GET /admin/users/:userId — Get single user details
  router.get("/users/:userId", authenticate, async (req, res, next) => {
    try {
      const actor = await getActor(req as AuthenticatedRequest);
      if (!actor) {
        res.status(403).json(fail("Admin role is required", "ADMIN_REQUIRED"));
        return;
      }

      const userId = getRouteParam(req.params.userId) ?? "";
      const user = await userRepository.findById(userId);
      if (!user) {
        res.status(404).json(fail("User not found", "USER_NOT_FOUND"));
        return;
      }

      res.json(ok({ user }));
    } catch (error) {
      next(error);
    }
  });

  // PATCH /admin/users/:userId — Update user profile details
  router.patch("/users/:userId", authenticate, async (req, res, next) => {
    try {
      const actor = await getActor(req as AuthenticatedRequest);
      if (!actor) {
        res.status(403).json(fail("Admin role is required", "ADMIN_REQUIRED"));
        return;
      }

      const userId = getRouteParam(req.params.userId) ?? "";
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json(fail("Invalid update inputs", "BAD_REQUEST"));
        return;
      }

      const updated = await userRepository.updateUser!(userId, parsed.data);
      if (!updated) {
        res.status(404).json(fail("User not found", "USER_NOT_FOUND"));
        return;
      }

      res.json(ok({ user: updated }));
    } catch (error) {
      next(error);
    }
  });

  // PATCH /admin/users/:userId/role — Update user systemRole (uses assignment service)
  router.patch("/users/:userId/role", authenticate, async (req, res, next) => {
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
        next(error);
      }
    }
  });

  // PATCH /admin/users/:userId/status — Update user status (uses assignment service)
  router.patch("/users/:userId/status", authenticate, async (req, res, next) => {
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
        next(error);
      }
    }
  });

  // POST /admin/users/:userId/reset-password — Force reset user password
  router.post("/users/:userId/reset-password", authenticate, async (req, res, next) => {
    try {
      const actor = await getActor(req as AuthenticatedRequest);
      if (!actor) {
        res.status(403).json(fail("Admin role is required", "ADMIN_REQUIRED"));
        return;
      }

      const userId = getRouteParam(req.params.userId) ?? "";
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json(fail("Invalid password input", "BAD_REQUEST"));
        return;
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, env.bcryptSaltRounds);
      const success = await userRepository.changePassword!(userId, passwordHash);
      if (!success) {
        res.status(404).json(fail("User not found", "USER_NOT_FOUND"));
        return;
      }

      res.json(ok({ success: true }));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
