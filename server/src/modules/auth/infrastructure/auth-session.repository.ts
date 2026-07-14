import { RefreshSessionModel } from "../../../db/models.js";

export type CreateRefreshSessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
};

export function createRefreshSessionRecord(record: CreateRefreshSessionRecord) {
  return RefreshSessionModel.create(record);
}

export function findActiveSessionById(sessionId: string) {
  return RefreshSessionModel.findOne({
    id: sessionId,
    revokedAt: { $exists: false },
  }).lean();
}

export function findValidRefreshSession(sessionId: string, tokenHash: string) {
  return RefreshSessionModel.findOne({
    id: sessionId,
    tokenHash,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
}

export function revokeSessionById(sessionId: string) {
  return RefreshSessionModel.updateOne(
    { id: sessionId },
    { $set: { revokedAt: new Date() } },
  );
}

export function revokeSessionByRefreshTokenHash(tokenHash: string) {
  return RefreshSessionModel.updateOne(
    { tokenHash },
    { $set: { revokedAt: new Date() } },
  );
}
