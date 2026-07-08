import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import { AppError } from "../lib/http.js";
import { RefreshSessionModel, UserModel, stripMongo } from "../db/models.js";
import { env } from "../config/env.js";
import { publicUser } from "../domain/roles.js";
import type { AuthUser, Role } from "../types.js";

type AccessPayload = {
  sub: string;
  role: Role;
  sessionId: string;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function expiresAtFor(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function signAccess(payload: AccessPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

function signRefresh(payload: AccessPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

async function createRefreshSession(user: AuthUser, userAgent?: string, ip?: string) {
  const sessionId = `rs-${randomUUID()}`;
  const refreshToken = signRefresh({ sub: user.id, role: user.role, sessionId });
  await RefreshSessionModel.create({
    id: sessionId,
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: expiresAtFor(7),
    userAgent,
    ip
  });
  return {
    accessToken: signAccess({ sub: user.id, role: user.role, sessionId }),
    refreshToken,
    sessionId
  };
}

export async function login(email: string, password: string, userAgent?: string, ip?: string) {
  const user = (await UserModel.findOne({ email: email.toLowerCase().trim(), active: true }).lean()) as any;
  if (!user) throw new AppError(401, "Invalid email or password.", "INVALID_CREDENTIALS");

  const valid = await bcrypt.compare(password, String(user.passwordHash));
  if (!valid) throw new AppError(401, "Invalid email or password.", "INVALID_CREDENTIALS");

  const authUser = publicUser(stripMongo(user) as unknown as AuthUser);
  const tokens = await createRefreshSession(authUser, userAgent, ip);
  return { user: authUser, ...tokens };
}

export async function userForAccessToken(accessToken: string) {
  let payload: AccessPayload;
  try {
    payload = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as AccessPayload;
  } catch {
    throw new AppError(401, "Invalid or expired access token.", "INVALID_ACCESS_TOKEN");
  }

  const session = await RefreshSessionModel.findOne({ id: payload.sessionId, revokedAt: { $exists: false } }).lean();
  if (!session) throw new AppError(401, "Session has expired.", "SESSION_EXPIRED");

  const user = (await UserModel.findOne({ id: payload.sub, active: true }).lean()) as any;
  if (!user) throw new AppError(401, "User is not active.", "USER_INACTIVE");

  return { ...publicUser(stripMongo(user) as unknown as AuthUser), sessionId: payload.sessionId };
}

export async function refresh(refreshToken: string, userAgent?: string, ip?: string) {
  let payload: AccessPayload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AccessPayload;
  } catch {
    throw new AppError(401, "Invalid or expired refresh token.", "INVALID_REFRESH_TOKEN");
  }

  const tokenHash = hashToken(refreshToken);
  const session = await RefreshSessionModel.findOne({
    id: payload.sessionId,
    tokenHash,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  });
  if (!session) throw new AppError(401, "Refresh session is no longer valid.", "INVALID_REFRESH_SESSION");

  session.revokedAt = new Date();
  await session.save();

  const user = (await UserModel.findOne({ id: payload.sub, active: true }).lean()) as any;
  if (!user) throw new AppError(401, "User is not active.", "USER_INACTIVE");

  const authUser = publicUser(stripMongo(user) as unknown as AuthUser);
  return { user: authUser, ...(await createRefreshSession(authUser, userAgent, ip)) };
}

export async function logout(refreshToken?: string, sessionId?: string) {
  if (refreshToken) {
    await RefreshSessionModel.updateOne({ tokenHash: hashToken(refreshToken) }, { $set: { revokedAt: new Date() } });
    return;
  }

  if (sessionId) {
    await RefreshSessionModel.updateOne({ id: sessionId }, { $set: { revokedAt: new Date() } });
  }
}
