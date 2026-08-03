import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import { MaterialModel } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import {
  assertCanMutateMaterialById,
  assertCanMutateMaterialTarget,
  materialScopeFilter,
  mergeScope,
} from "../services/authorization.service.js";
import { filterFromQuery, paginated, patchById, requireActor, stripMongo } from "./helpers.js";
import { parseBody, rejectProtectedFields, sanitizePatch } from "../validators/common.js";
import {
  createMaterialSchema,
  patchMaterialSchema,
  addMaterialVersionSchema,
} from "../validators/material.schema.js";
import type { AuthedRequest } from "../types.js";

export const listMaterials = asyncRoute(async (req: AuthedRequest, res) =>
  paginated(
    req,
    res,
    MaterialModel,
    mergeScope(filterFromQuery(req), await materialScopeFilter(requireActor(req), "read")),
    { updatedAt: -1 },
  ),
);
export const createMaterial = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const body = parseBody(createMaterialSchema, req);
  rejectProtectedFields(body as Record<string, unknown>);
  await assertCanMutateMaterialTarget(actor, body);
  const materialId = id("material");
  const hasFile = body.fileKey || body.url;
  const version = hasFile
    ? {
        id: id("matv"),
        version: 1,
        fileKey: body.fileKey,
        url: body.url,
        thumbnailUrl: body.thumbnailUrl,
        mimeType: body.mimeType,
        size: body.size,
        metadata: body.metadata,
        uploadedById: req.actor?.id,
        uploadedByName: req.actor?.name,
        uploadedAt: nowIso(),
      }
    : undefined;
  const item = await MaterialModel.create({
    id: materialId,
    ...body,
    currentVersion: version ? 1 : undefined,
    versions: version ? [version] : [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  await audit(req, "material.create", "material", item.id);
  created(res, item);
});
export const patchMaterial = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const body = parseBody(patchMaterialSchema, req);
  const allowedFields = [
    "title",
    "kind",
    "chapterId",
    "type",
    "category",
    "description",
    "fileKey",
    "url",
    "thumbnailUrl",
    "mimeType",
    "size",
    "tags",
    "metadata",
  ];
  const patch = sanitizePatch(body as Record<string, unknown>, allowedFields);
  const existing = (await MaterialModel.findOne({ id: String(req.params.id) }).lean()) as any;
  if (!existing) throw new AppError(404, "Material not found.", "MATERIAL_NOT_FOUND");
  await assertCanMutateMaterialById(actor, String(req.params.id));
  if (body.chapterId) {
    await assertCanMutateMaterialTarget(actor, { chapterId: body.chapterId });
  }
  ok(res, await patchById(req, MaterialModel, String(req.params.id), "material.update", patch));
});

export const addMaterialVersion = asyncRoute(async (req: AuthedRequest, res) => {
  await assertCanMutateMaterialById(requireActor(req), String(req.params.id));
  const body = parseBody(addMaterialVersionSchema, req);
  rejectProtectedFields(body as Record<string, unknown>);
  const material = await MaterialModel.findOne({ id: String(req.params.id) });
  if (!material) throw new AppError(404, "Material not found.", "MATERIAL_NOT_FOUND");
  const nextVersion = Number((material as any).currentVersion ?? 0) + 1;
  const version = {
    id: id("matv"),
    version: nextVersion,
    ...body,
    uploadedById: req.actor?.id,
    uploadedByName: req.actor?.name,
    uploadedAt: nowIso(),
  };
  (material as any).versions = [...((material as any).versions ?? []), version];
  (material as any).currentVersion = nextVersion;
  (material as any).updatedAt = nowIso();
  await material.save();
  await audit(req, "material.version", "material", String(req.params.id));
  ok(res, stripMongo(material));
});

export const deleteMaterial = asyncRoute(async (req: AuthedRequest, res) => {
  await assertCanMutateMaterialById(requireActor(req), String(req.params.id));
  const materialId = String(req.params.id);
  const existing = await MaterialModel.findOne({ id: materialId });
  if (!existing) throw new AppError(404, "Material not found.", "MATERIAL_NOT_FOUND");
  await MaterialModel.deleteOne({ id: materialId });
  await audit(req, "material.delete", "material", materialId);
  ok(res, { id: materialId });
});

