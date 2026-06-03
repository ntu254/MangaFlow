import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, type JwtPayload } from "../../infrastructure/jwt/index.js";
import { fail } from "../../shared/responses/api-response.js";
import type { UserRepository } from "./auth.service.js";
import { createMongoUserRepository } from "./auth.repository.js";

export type AuthVerifier = {
  verify(token: string): Promise<JwtPayload | null>;
  verifyWithProfile(token: string): Promise<JwtPayload | null>;
};

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    _id: string;
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

export function createJwtAuthVerifier(userRepository?: UserRepository): AuthVerifier {
  const repo = userRepository ?? createMongoUserRepository();
  return {
    async verify(token) {
      const payload = verifyAccessToken(token);
      if (!payload || !payload.sub) return null;
      const user = await repo.findById(payload.sub);
      if (!user || user.status !== "ACTIVE") return null;
      return {
        sub: user.id,
        systemRole: user.systemRole,
        status: user.status,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl
      };
    },
    async verifyWithProfile(token) {
      const payload = verifyAccessToken(token);
      if (!payload || !payload.sub) return null;
      const user = await repo.findById(payload.sub);
      if (!user || user.status !== "ACTIVE") return null;
      return {
        sub: user.id,
        systemRole: user.systemRole,
        status: user.status,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl
      };
    }
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

    const userId = payload.sub ?? (payload as any).clerkId;
    if (!userId) {
      res.status(401).json(fail("Invalid token payload", "AUTH_INVALID"));
      return;
    }

    // Attach req.user
    req.user = {
      id: userId,
      _id: userId,
      systemRole: payload.systemRole ?? null,
      status: payload.status ?? "ACTIVE",
      email: payload.email ?? "",
      fullName: payload.fullName ?? "",
      avatarUrl: payload.avatarUrl ?? null,
    };

    next();
  };
}
