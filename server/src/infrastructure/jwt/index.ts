import jwt from "jsonwebtoken";
import { env } from "../../config/env.config.js";

const JWT_ALGORITHM = "HS256";

export type JwtPayload = {
  sub?: string; // The user's ID
  systemRole?: string | null; // Nullable/optional for compatibility in tests
  status?: string; // Optional for compatibility in tests
  email?: string;
  fullName?: string;
  avatarUrl?: string | null;
};

export type RefreshJwtPayload = {
  jti: string; // Session ID or Token ID
  sub: string; // User ID
};

export function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    algorithm: JWT_ALGORITHM as any,
    expiresIn: env.accessTokenExpiresIn as any,
  });
}

export function signRefreshToken(payload: Omit<RefreshJwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    algorithm: JWT_ALGORITHM as any,
    expiresIn: env.refreshTokenExpiresIn as any,
  });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret, {
      algorithms: [JWT_ALGORITHM],
    });
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshJwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtRefreshSecret, {
      algorithms: [JWT_ALGORITHM],
    });
    return decoded as RefreshJwtPayload;
  } catch {
    return null;
  }
}

// Keep verifyJwt alias for compatibility if needed elsewhere
export function verifyJwt<T = JwtPayload>(token: string, secret: string): T | null {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    });
    return decoded as T;
  } catch {
    return null;
  }
}
