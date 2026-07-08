import { z } from "zod";
import { AppError } from "../lib/http.js";
import type { AuthedRequest } from "../types.js";

export function parseBody<T extends z.ZodTypeAny>(schema: T, req: AuthedRequest): z.infer<T> {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues || [];
    const message = issues.map((e: any) => `${e.path?.join(".") || "body"}: ${e.message}`).join("; ");
    throw new AppError(400, message || "Invalid request body", "VALIDATION_ERROR");
  }
  return result.data;
}

export function parseQuery<T extends z.ZodTypeAny>(schema: T, req: AuthedRequest): z.infer<T> {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const issues = result.error.issues || [];
    const message = issues.map((e: any) => `${e.path?.join(".") || "query"}: ${e.message}`).join("; ");
    throw new AppError(400, message || "Invalid query parameters", "VALIDATION_ERROR");
  }
  return result.data;
}

export function parseParams<T extends z.ZodTypeAny>(schema: T, req: AuthedRequest): z.infer<T> {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    const issues = result.error.issues || [];
    const message = issues.map((e: any) => `${e.path?.join(".") || "params"}: ${e.message}`).join("; ");
    throw new AppError(400, message || "Invalid route parameters", "VALIDATION_ERROR");
  }
  return result.data;
}

const PROTECTED_FIELDS = new Set([
  "_id",
  "id",
  "createdAt",
  "updatedAt",
  "authorId",
  "ownerId",
  "createdBy",
  "createdById",
  "createdByName",
  "passwordHash",
  "refreshToken",
  "isChair",
  "isEditorInChief",
  "status",
  "state",
  "decision",
  "submittedAt",
  "approvedAt",
  "completedAt",
  "reviewerId",
  "rejectedAt",
  "archivedAt",
  "readAt",
  "resolvedAt",
  "resolvedBy",
  "assistantId",
  "assistantName",
  "version",
  "versions",
  "currentVersion",
  "history",
  "votes",
  "revisionRound",
  "requestId"
]);

export function pickAllowedFields<T extends Record<string, unknown>>(
  input: T,
  allowedFields: string[]
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in input) {
      result[key] = input[key];
    }
  }
  return result as Partial<T>;
}

export function rejectProtectedFields<T extends Record<string, unknown>>(input: T): void {
  for (const key of Object.keys(input)) {
    if (PROTECTED_FIELDS.has(key)) {
      throw new AppError(400, `Field "${key}" cannot be set directly.`, "PROTECTED_FIELD");
    }
  }
}

export function rejectStatusOverride<T extends Record<string, unknown>>(input: T): void {
  if ("status" in input || "state" in input) {
    throw new AppError(400, "Status cannot be changed directly. Use the appropriate action endpoint.", "STATUS_IMMUTABLE");
  }
}

export function sanitizePatch<T extends Record<string, unknown>>(
  input: T,
  allowedFields: string[],
  opts?: { rejectStatus?: boolean }
): Partial<T> {
  const picked = pickAllowedFields(input, allowedFields);
  rejectProtectedFields(picked as Record<string, unknown>);
  if (opts?.rejectStatus !== false) {
    rejectStatusOverride(picked as Record<string, unknown>);
  }
  return picked;
}
