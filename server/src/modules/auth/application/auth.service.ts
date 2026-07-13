import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { AppError } from "../../../lib/http.js";
import type { AuthUser } from "../../../types.js";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  tokenPayloadFor,
  verifyAccessToken,
  verifyRefreshToken,
} from "../domain/auth-token.js";
import {
  createRefreshSessionRecord,
  findActiveSessionById,
  findValidRefreshSession,
  revokeSessionById,
  revokeSessionByRefreshTokenHash,
} from "../infrastructure/auth-session.repository.js";
import {
  findActiveAuthUserByEmail,
  findActiveAuthUserById,
} from "../infrastructure/auth-user.repository.js";

function expiresAtFor(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function createRefreshSession(user: AuthUser, userAgent?: string, ip?: string) {
  const sessionId = `rs-${randomUUID()}`;
  const refreshToken = signRefreshToken(tokenPayloadFor(user, sessionId));
  await createRefreshSessionRecord({
    id: sessionId,
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: expiresAtFor(7),
    userAgent,
    ip,
  });

  return {
    accessToken: signAccessToken(tokenPayloadFor(user, sessionId)),
    refreshToken,
    sessionId,
  };
}

export async function login(email: string, password: string, userAgent?: string, ip?: string) {
  const user = await findActiveAuthUserByEmail(email);
  if (!user) throw new AppError(401, "Invalid email or password.", "INVALID_CREDENTIALS");

  const valid = await bcrypt.compare(password, String(user.raw.passwordHash));
  if (!valid) throw new AppError(401, "Invalid email or password.", "INVALID_CREDENTIALS");

  const tokens = await createRefreshSession(user.authUser, userAgent, ip);
  return { user: user.authUser, ...tokens };
}

export async function userForAccessToken(accessToken: string) {
  let payload;
  try {
    payload = verifyAccessToken(accessToken);
  } catch {
    throw new AppError(401, "Invalid or expired access token.", "INVALID_ACCESS_TOKEN");
  }

  const session = await findActiveSessionById(payload.sessionId);
  if (!session) throw new AppError(401, "Session has expired.", "SESSION_EXPIRED");

  const user = await findActiveAuthUserById(payload.sub);
  if (!user) throw new AppError(401, "User is not active.", "USER_INACTIVE");

  return { ...user, sessionId: payload.sessionId };
}

export async function refresh(refreshToken: string, userAgent?: string, ip?: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token.", "INVALID_REFRESH_TOKEN");
  }

  const session = await findValidRefreshSession(payload.sessionId, hashRefreshToken(refreshToken));
  if (!session) {
    throw new AppError(401, "Refresh session is no longer valid.", "INVALID_REFRESH_SESSION");
  }

  session.revokedAt = new Date();
  await session.save();

  const user = await findActiveAuthUserById(payload.sub);
  if (!user) throw new AppError(401, "User is not active.", "USER_INACTIVE");

  return { user, ...(await createRefreshSession(user, userAgent, ip)) };
}

export async function logout(refreshToken?: string, sessionId?: string) {
  if (refreshToken) {
    await revokeSessionByRefreshTokenHash(hashRefreshToken(refreshToken));
    return;
  }

  if (sessionId) {
    await revokeSessionById(sessionId);
  }
}
