import { Router } from "express";
import { env } from "../../config/env.config.js";
import { fail, ok } from "../../shared/responses/api-response.js";
import { signJwt } from "../../infrastructure/jwt/index.js";
import { getGoogleAuthUrl, exchangeGoogleCode } from "../../infrastructure/google/index.js";
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

function authPayload(user: AuthUser, service: ReturnType<typeof createAuthService>) {
  return { user, auth: service.getAuthRedirectState(user) };
}

function forbiddenIfSuspended(user: AuthUser) {
  return user.status === "SUSPENDED";
}

function generateToken(user: AuthUser): string {
  return signJwt(
    {
      sub: user.clerkId,
      systemRole: user.systemRole,
      status: user.status,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    },
    env.jwtSecret
  );
}

export function createAuthRouter(dependencies: AuthRouteDependencies) {
  const router = Router();
  const service = createAuthService(dependencies.userRepository);
  const authenticate = requireAuth(dependencies.authVerifier);

  // GET /auth/google — redirect user to Google OAuth consent screen
  router.get("/google", (_req, res) => {
    const redirectUri = `${env.appUrl}/oauth/callback`;
    const authUrl = getGoogleAuthUrl(env.googleClientId, redirectUri);
    res.redirect(authUrl);
  });

  // POST /auth/google/callback — exchange Google code for JWT
  router.post("/google/callback", async (req, res) => {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      res.status(400).json(fail("Authorization code is required", "AUTH_INVALID"));
      return;
    }
    const redirectUri = `${env.appUrl}/oauth/callback`;
    const profile = await exchangeGoogleCode(code, env.googleClientId, env.googleClientSecret, redirectUri);
    if (!profile) {
      res.status(401).json(fail("Failed to verify Google token", "AUTH_INVALID"));
      return;
    }
    const user = await service.syncUserFromProfile({
      clerkId: profile.sub,
      email: profile.email,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    });
    if (forbiddenIfSuspended(user)) {
      res.status(403).json(fail("Account suspended", "ACCOUNT_SUSPENDED"));
      return;
    }
    const token = generateToken(user);
    res.json(ok({ token, ...authPayload(user, service) }));
  });

  // GET /auth/me — current user from DB
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

  // POST /auth/sync-user — upsert user from JWT profile (deprecated, kept for backward compat)
  router.post("/sync-user", authenticate, async (req, res) => {
    console.warn("[DEPRECATION] POST /auth/sync-user called — use JWT claims instead");
    const profile = (req as AuthenticatedRequest).auth;
    if (!profile) {
      res.status(401).json(fail("Authentication required", "AUTH_REQUIRED"));
      return;
    }
    const user = await service.syncUserFromProfile({
      clerkId: profile.clerkId,
      email: profile.email,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    });
    if (forbiddenIfSuspended(user)) {
      res.status(403).json(fail("Account suspended", "ACCOUNT_SUSPENDED"));
      return;
    }
    res.json(ok({ token: generateToken(user), ...authPayload(user, service) }));
  });

  // POST /auth/complete-onboarding — set role after onboarding
  router.post("/complete-onboarding", authenticate, async (req, res) => {
    const profile = (req as AuthenticatedRequest).auth;
    if (!profile) {
      res.status(401).json(fail("Authentication required", "AUTH_REQUIRED"));
      return;
    }
    try {
      const user = await service.completeOnboarding(profile.clerkId, req.body);
      const token = generateToken(user);
      res.json(ok({ token, ...authPayload(user, service) }));
    } catch (error) {
      if (error instanceof AuthServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      throw error;
    }
  });

  return router;
}

