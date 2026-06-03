import { createClerkClient } from "@clerk/backend";
import { Router } from "express";
import { env } from "../../config/env.config.js";
import { fail, ok } from "../../shared/responses/api-response.js";
import {
  requireAuth,
  type AuthenticatedRequest,
  type AuthVerifier
} from "./auth.middleware.js";
import {
  AuthServiceError,
  createAuthService,
  type AuthUser,
  type UserRepository
} from "./auth.service.js";

export type AuthRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
};

function authPayload(
  user: AuthUser,
  service: ReturnType<typeof createAuthService>
) {
  return {
    user,
    auth: service.getAuthRedirectState(user)
  };
}

function forbiddenIfSuspended(user: AuthUser) {
  return user.status === "SUSPENDED";
}

async function syncClerkMetadata(
  clerkId: string,
  systemRole: import("./auth.service.js").SystemRole | null,
  status: import("./auth.service.js").UserStatus
) {
  if (!env.clerkSecretKey) return;

  try {
    const clerkClient = createClerkClient({
      secretKey: env.clerkSecretKey
    });
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        systemRole,
        status
      }
    });
  } catch (error) {
    console.warn(`[Clerk Sync] Failed to sync metadata for ${clerkId}:`, error);
  }
}

export function createAuthRouter(dependencies: AuthRouteDependencies) {
  const router = Router();
  const service = createAuthService(dependencies.userRepository);
  const authenticate = requireAuth(dependencies.authVerifier);

  router.get("/me", authenticate, async (req, res) => {
    const profile = (req as AuthenticatedRequest).auth;
    if (!profile) {
      res.status(401).json(fail("Authentication required", "AUTH_REQUIRED"));
      return;
    }

    const user = await service.getCurrentUser(profile.clerkId);
    if (!user) {
      res.status(404).json(fail("User not synced", "USER_NOT_SYNCED"));
      return;
    }

    if (forbiddenIfSuspended(user)) {
      res.status(403).json(fail("Account suspended", "ACCOUNT_SUSPENDED"));
      return;
    }

    res.json(ok(authPayload(user, service)));
  });

  router.post("/sync-user", authenticate, async (req, res) => {
    console.warn("[DEPRECATION] POST /auth/sync-user called — use JWT claims instead");
    const profile = (req as AuthenticatedRequest).auth;
    if (!profile) {
      res.status(401).json(fail("Authentication required", "AUTH_REQUIRED"));
      return;
    }

    // sync-user needs full profile from Clerk (for upsert)
    const fullProfile = await dependencies.authVerifier.verifyWithProfile(
      req.get("Authorization")?.slice("Bearer ".length).trim() ?? ""
    );

    if (!fullProfile) {
      res.status(401).json(fail("Invalid authentication token", "AUTH_INVALID"));
      return;
    }

    const user = await service.syncUserFromClerk(fullProfile);
    if (forbiddenIfSuspended(user)) {
      res.status(403).json(fail("Account suspended", "ACCOUNT_SUSPENDED"));
      return;
    }

    res.json(ok(authPayload(user, service)));
  });

  router.post("/complete-onboarding", authenticate, async (req, res) => {
    const profile = (req as AuthenticatedRequest).auth;
    if (!profile) {
      res.status(401).json(fail("Authentication required", "AUTH_REQUIRED"));
      return;
    }

    try {
      const user = await service.completeOnboarding(profile.clerkId, req.body);

      // Sync requestedSystemRole to Clerk metadata (role is null until admin assigns)
      await syncClerkMetadata(user.clerkId, user.systemRole, user.status);

      res.json(ok(authPayload(user, service)));
    } catch (error) {
      if (error instanceof AuthServiceError) {
        res
          .status(error.statusCode)
          .json(fail(error.message, error.code));
        return;
      }

      throw error;
    }
  });

  return router;
}
