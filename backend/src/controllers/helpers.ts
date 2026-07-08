import { id, nowIso } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import { audit } from "../services/audit.service.js";
import { stripMongo } from "../db/models.js";
import type { AuthedRequest } from "../types.js";
import type { Response } from "express";

const IMMUTABLE_FIELDS = new Set([
  "_id",
  "__v",
  "id",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "isDeleted",
  "role",
  "permissions",
  "mfaEnrolled",
  "mfaVerifiedAt",
]);

function stripUnsafeFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!IMMUTABLE_FIELDS.has(k)) out[k] = v;
  }
  return out;
}

export function requireActor(req: AuthedRequest) {
  if (!req.actor) throw new AppError(401, "Missing authenticated user.", "MISSING_AUTH");
  return req.actor;
}

export function filterFromQuery(req: AuthedRequest) {
  const allowed = [
    "seriesId",
    "chapterId",
    "pageId",
    "regionId",
    "taskId",
    "assigneeId",
    "assistantId",
    "proposalId",
    "priority",
    "status",
  ];
  return Object.fromEntries(
    allowed.filter((key) => typeof req.query[key] === "string").map((key) => [key, req.query[key]]),
  );
}

export function paginationFromQuery(req: AuthedRequest) {
  const pageRaw = Number(req.query.page ?? 1);
  const limitRaw = Number(req.query.limit ?? req.query.pageSize ?? 50);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 100) : 50;
  return { page, limit, skip: (page - 1) * limit };
}

export async function paginated(
  req: AuthedRequest,
  res: Response,
  model: any,
  filter: Record<string, unknown>,
  sort: Record<string, 1 | -1>,
) {
  const { page, limit, skip } = paginationFromQuery(req);
  const [data, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    model.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      pageSize: limit,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

export async function createLoose(req: AuthedRequest, model: any, prefix: string, action: string) {
  const safe = stripUnsafeFields(req.body ?? {});
  const item = await model.create({
    id: id(prefix),
    ...safe,
    createdAt: safe.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  });
  await audit(req, action, prefix, item.id);
  return item;
}

export async function patchLoose(req: AuthedRequest, model: any, idKey: string, action: string) {
  const targetId = req.body?.id ?? req.body?.[idKey];
  if (!targetId) throw new AppError(400, `${idKey} or id is required.`, "VALIDATION_ERROR");
  return patchById(req, model, targetId, action);
}

export async function patchById(
  req: AuthedRequest,
  model: any,
  targetId: string,
  action: string,
  patch: Record<string, unknown> = {},
) {
  const setFields = Object.keys(patch).length > 0 ? patch : stripUnsafeFields(req.body ?? {});
  const item = await model
    .findOneAndUpdate(
      { id: targetId },
      { $set: { ...setFields, updatedAt: nowIso() } },
      { returnDocument: "after" },
    )
    .lean();
  if (!item) throw new AppError(404, "Record not found.", "RECORD_NOT_FOUND");
  await audit(req, action, "record", targetId);
  return item;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function validateAction<T extends string>(raw: string, validActions: readonly T[]): T {
  const normalized = raw.replace(/-/g, "_").toUpperCase() as T;
  if (!validActions.includes(normalized)) {
    throw new AppError(400, `Invalid action: ${raw}`, "INVALID_ACTION");
  }
  return normalized;
}

export { stripMongo };
