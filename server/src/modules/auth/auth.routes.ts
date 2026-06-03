import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.config.js";
import { fail, ok } from "../../shared/responses/api-response.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../infrastructure/jwt/index.js";
import {
  exchangeGoogleCode,
  getGoogleAuthUrl
} from "../../infrastructure/google/index.js";
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
import type { SessionRepository } from "./session.repository.js";

export type AuthRouteDependencies = {
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  sessionRepository: SessionRepository;
};

function authPayload(user: AuthUser, service: ReturnType<typeof createAuthService>) {
  return { user, auth: service.getAuthRedirectState(user) };
}

async function generateTokens(user: AuthUser, sessionRepo: SessionRepository) {
  const accessToken = signAccessToken({
    sub: user.id,
    systemRole: user.systemRole,
    status: user.status,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const session = await sessionRepo.createSession(user.id, expiresAt);

  const refreshToken = signRefreshToken({
    jti: session._id,
    sub: user.id,
  });

  return { accessToken, refreshToken };
}

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

const googleCallbackSchema = z.object({
  code: z.string().min(1, "Code is required")
});

export function createAuthRouter(dependencies: AuthRouteDependencies) {
  const router = Router();
  const service = createAuthService(dependencies.userRepository);
  const authenticate = requireAuth(dependencies.authVerifier);
  const { sessionRepository } = dependencies;

  // POST /auth/login — password-based login
  router.post("/login", async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json(fail("Invalid input parameters", "BAD_REQUEST"));
        return;
      }

      const { email, password } = parsed.data;
      const user = await service.authenticate(email, password);

      const { accessToken, refreshToken } = await generateTokens(user, sessionRepository);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json(ok({ token: accessToken, ...authPayload(user, service) }));
    } catch (error) {
      if (error instanceof AuthServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      next(error);
    }
  });

  router.get("/google", (_req, res) => {
    if (!env.googleClientId) {
      res.status(503).json(fail("Google OAuth is not configured", "OAUTH_NOT_CONFIGURED"));
      return;
    }

    const redirectUri = `${env.appUrl}/oauth/callback`;
    res.redirect(getGoogleAuthUrl(env.googleClientId, redirectUri));
  });

  router.post("/google/callback", async (req, res, next) => {
    try {
      if (!env.googleClientId || !env.googleClientSecret) {
        res.status(503).json(fail("Google OAuth is not configured", "OAUTH_NOT_CONFIGURED"));
        return;
      }

      const parsed = googleCallbackSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json(fail("Invalid input parameters", "BAD_REQUEST"));
        return;
      }

      const redirectUri = `${env.appUrl}/oauth/callback`;
      const googleProfile = await exchangeGoogleCode(
        parsed.data.code,
        env.googleClientId,
        env.googleClientSecret,
        redirectUri
      );

      if (!googleProfile) {
        res.status(401).json(fail("Invalid Google authorization code", "AUTH_INVALID"));
        return;
      }

      const user = await service.syncUserFromProfile({
        clerkId: googleProfile.sub,
        email: googleProfile.email,
        fullName: googleProfile.fullName,
        avatarUrl: googleProfile.avatarUrl
      });

      if (user.status === "SUSPENDED") {
        res.status(403).json(fail("Account suspended", "ACCOUNT_SUSPENDED"));
        return;
      }

      const { accessToken, refreshToken } = await generateTokens(user, sessionRepository);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json(ok({ token: accessToken, ...authPayload(user, service) }));
    } catch (error) {
      next(error);
    }
  });

  // POST /auth/refresh — refresh access token (compatible with client)
  router.post("/refresh", async (req, res, next) => {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        res.status(401).json(fail("No refresh token provided", "AUTH_REQUIRED"));
        return;
      }

      const payload = verifyRefreshToken(token);
      if (!payload || !payload.jti) {
        res.status(401).json(fail("Invalid refresh token", "AUTH_INVALID"));
        return;
      }

      const session = await sessionRepository.findValidSession(payload.jti);
      if (!session) {
        res.clearCookie("refreshToken");
        res.status(401).json(fail("Session expired or revoked", "AUTH_INVALID"));
        return;
      }

      const user = await service.getCurrentUser(payload.sub);
      if (!user) {
        res.clearCookie("refreshToken");
        res.status(401).json(fail("User session not found", "AUTH_INVALID"));
        return;
      }

      if (user.status === "SUSPENDED") {
        res.clearCookie("refreshToken");
        res.status(403).json(fail("Account suspended", "ACCOUNT_SUSPENDED"));
        return;
      }

      const accessToken = signAccessToken({
        sub: user.id,
        systemRole: user.systemRole,
        status: user.status,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      });

      res.json(ok({ token: accessToken, ...authPayload(user, service) }));
    } catch (error) {
      next(error);
    }
  });

  // POST /auth/refresh-token — alias for compatibility
  router.post("/refresh-token", async (req, res, next) => {
    req.url = "/refresh";
    next();
  });

  // POST /auth/logout — logout and revoke session
  router.post("/logout", async (req, res, next) => {
    try {
      const token = req.cookies?.refreshToken;
      if (token) {
        const payload = verifyRefreshToken(token);
        if (payload?.jti) {
          await sessionRepository.revokeSession(payload.jti);
        }
      }
      res.clearCookie("refreshToken");
      res.json(ok({ success: true }));
    } catch (error) {
      next(error);
    }
  });

  // GET /auth/me — current user profile from DB
  router.get("/me", authenticate, async (req, res, next) => {
    try {
      const authRequest = req as AuthenticatedRequest;
      const profile = authRequest.user;
      if (!profile) {
        res.status(401).json(fail("Authentication required", "AUTH_REQUIRED"));
        return;
      }

      const user = await service.getCurrentUser(profile.id);
      if (!user) {
        res.status(404).json(fail("User not found", "USER_NOT_FOUND"));
        return;
      }

      if (user.status === "SUSPENDED") {
        res.status(403).json(fail("Account suspended", "ACCOUNT_SUSPENDED"));
        return;
      }

      res.json(ok(authPayload(user, service)));
    } catch (error) {
      next(error);
    }
  });

  router.post("/complete-onboarding", authenticate, async (req, res, next) => {
    try {
      const authRequest = req as AuthenticatedRequest;
      const profile = authRequest.user;
      if (!profile) {
        res.status(401).json(fail("Authentication required", "AUTH_REQUIRED"));
        return;
      }

      const user = await service.completeOnboarding(profile.id, req.body);
      if (!user) {
        res.status(404).json(fail("User not found", "USER_NOT_FOUND"));
        return;
      }

      const accessToken = signAccessToken({
        sub: user.id,
        systemRole: user.systemRole,
        status: user.status,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      });

      res.json(ok({ token: accessToken, ...authPayload(user, service) }));
    } catch (error) {
      if (error instanceof AuthServiceError) {
        res.status(error.statusCode).json(fail(error.message, error.code));
        return;
      }
      next(error);
    }
  });

  // POST /auth/sync-user — legacy endpoint for test compatibility
  router.post("/sync-user", authenticate, async (req, res, next) => {
    try {
      const authRequest = req as AuthenticatedRequest;
      const profile = authRequest.user;
      if (!profile) {
        res.status(401).json(fail("Authentication required", "AUTH_REQUIRED"));
        return;
      }
      const user = await service.syncUserFromProfile({
        clerkId: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl
      });
      res.json(ok(authPayload(user, service)));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
