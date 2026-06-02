import { Router } from "express";
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
    const profile = (req as AuthenticatedRequest).auth;
    if (!profile) {
      res.status(401).json(fail("Authentication required", "AUTH_REQUIRED"));
      return;
    }

    const user = await service.syncUserFromClerk(profile);
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
