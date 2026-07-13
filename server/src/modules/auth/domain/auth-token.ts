import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.js";
import type { AuthUser, Role } from "../../../types.js";

export type AccessPayload = {
  sub: string;
  role: Role;
  sessionId: string;
};

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(payload: AccessPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: AccessPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(accessToken: string) {
  return jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(refreshToken: string) {
  return jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AccessPayload;
}

export function tokenPayloadFor(user: AuthUser, sessionId: string): AccessPayload {
  return {
    sub: user.id,
    role: user.role,
    sessionId,
  };
}
