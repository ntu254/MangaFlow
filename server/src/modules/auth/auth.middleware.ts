import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env.config.js";
import { verifyJwt, type JwtPayload } from "../../infrastructure/jwt/index.js";
import { verifyGoogleToken, exchangeGoogleCode, type GoogleProfile } from "../../infrastructure/google/index.js";
import { fail } from "../../shared/responses/api-response.js";

export type AuthVerifier = {
  verify(token: string): Promise<JwtPayload | null>;
  verifyWithProfile(token: string): Promise<JwtPayload | null>;
};

export type AuthenticatedRequest = Request & {
  auth?: {
    clerkId: string;
    systemRole: string | null;
    status: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
};

function getBearerToken(req: Request) {
  const header = req.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export function createJwtAuthVerifier(): AuthVerifier {
  return {
    async verify(token) {
      if (!env.jwtSecret) return null;
      const payload = verifyJwt(token, env.jwtSecret);
      if (!payload) return null;
      return payload;
    },
    async verifyWithProfile(token) {
      if (!env.jwtSecret) return null;
      const payload = verifyJwt(token, env.jwtSecret);
      if (!payload) return null;
      return payload;
    },
  };
}

export function requireAuth(authVerifier: AuthVerifier) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json(fail("Authentication required", "AUTH_REQUIRED"));
      return;
    }
    const payload = await authVerifier.verify(token);
    if (!payload) {
      res.status(401).json(fail("Invalid authentication token", "AUTH_INVALID"));
      return;
    }
    req.auth = {
      clerkId: payload.sub,
      systemRole: payload.systemRole,
      status: payload.status,
      email: payload.email,
      fullName: payload.fullName,
      avatarUrl: payload.avatarUrl,
    };
    next();
  };
}
