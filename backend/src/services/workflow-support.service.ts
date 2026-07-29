import { AuditEntryModel, OutboxEventModel, stripMongo } from "../db/models.js";
import { id } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import mongoose, { type ClientSession } from "mongoose";
import type { AuthedRequest } from "../types.js";

export function toObject<T>(doc: unknown) {
  return stripMongo(doc) as T;
}

export function expectedVersionFilter(payload: any) {
  const expectedVersion = Number(payload?.expectedVersion);
  return Number.isInteger(expectedVersion) && expectedVersion > 0
    ? { version: expectedVersion }
    : {};
}

export function assertSessionVersionMatches(session: any, payload: any) {
  const expectedVersion = Number(payload?.expectedVersion);
  if (
    Number.isInteger(expectedVersion) &&
    expectedVersion > 0 &&
    Number(session?.version ?? 1) !== expectedVersion
  ) {
    throw new AppError(
      409,
      "Voting session changed while applying this command.",
      "VERSION_CONFLICT",
    );
  }
}

export async function createAuditEntry(
  req: AuthedRequest,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
  session?: ClientSession,
) {
  const actor = req.actor;
  if (!actor) throw new AppError(401, "Missing authenticated user.", "MISSING_AUTH");
  await AuditEntryModel.create(
    [
      {
        id: id("aud"),
        actorId: actor.id,
        actorRole: actor.role,
        action,
        entityType,
        entityId,
        metadata,
        requestId: req.requestId,
        createdAt: new Date(),
      },
    ],
    session ? { session } : undefined,
  );
}

export async function createOutboxEvent(
  type: string,
  aggregateType: string,
  aggregateId: string,
  payload: any,
  session?: ClientSession,
) {
  await OutboxEventModel.create(
    [
      {
        id: id("outbox"),
        type,
        aggregateType,
        aggregateId,
        payload,
        status: "PENDING",
        attempts: 0,
        nextAttemptAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    session ? { session } : undefined,
  );
}

function isTransactionUnsupported(error: unknown) {
  return [error, (error as any)?.originalError].some((candidate) => {
    const message = String((candidate as any)?.message ?? candidate);
    return (
      message.includes("Transaction numbers are only allowed") ||
      message.includes("replica set member or mongos") ||
      (message.includes("Transaction") && message.includes("standalone"))
    );
  });
}

export async function runWorkflowTransaction<T>(fn: (session: ClientSession) => Promise<T>) {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      throw new AppError(
        503,
        "MongoDB replica set support is required for atomic workflow transactions.",
        "MONGODB_REPLICA_SET_REQUIRED",
      );
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
