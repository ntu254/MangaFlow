import { SeriesModel, SeriesMemberModel, UserModel, stripMongo } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import { audit } from "./audit.service.js";
import type { AuthedRequest } from "../types.js";
import { findTantouWorkloadBlockers } from "./assignment-workload.service.js";
import { runWorkflowTransaction } from "./workflow-support.service.js";

function toObject<T>(doc: unknown) {
  return stripMongo(doc) as T;
}

export async function getTantouEditor(seriesId: string) {
  const member = await SeriesMemberModel.findOne({
    seriesId,
    role: "editor",
    status: "active",
  }).lean();
  let resolvedMember = member;
  if (!resolvedMember) {
    const series = (await SeriesModel.findOne({ id: seriesId }).lean()) as any;
    if (!series?.editorId) return null;
    const legacyUser = (await UserModel.findOne({
      id: String(series.editorId),
      role: "EDITOR",
      active: { $ne: false },
    }).lean()) as any;
    if (!legacyUser) return null;
    resolvedMember = {
      id: `legacy-sm-${seriesId}-${legacyUser.id}`,
      seriesId,
      userId: legacyUser.id,
      role: "editor",
      scope: "full_series",
      status: "active",
    } as any;
  }
  const user = await UserModel.findOne({ id: (resolvedMember as any).userId }).lean();
  if (!user || (user as any).role !== "EDITOR" || (user as any).active === false) return null;
  return {
    ...(toObject(resolvedMember) as any),
    userName: (user as any)?.name ?? "Unknown",
    userEmail: (user as any)?.email ?? "",
  };
}

function assertOwningMangaka(req: AuthedRequest, series: any) {
  if (req.actor?.role !== "MANGAKA" || String(series.authorId) !== String(req.actor.id)) {
    throw new AppError(
      403,
      "Only the owning Mangaka can manage the Tantou Editor.",
      "MANGAKA_OWNER_REQUIRED",
    );
  }
}

export async function assignTantouEditor(req: AuthedRequest, seriesId: string, editorId: string) {
  const series = (await SeriesModel.findOne({ id: seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  assertOwningMangaka(req, series);

  const editorUser = await UserModel.findOne({ id: editorId }).lean();
  if (!editorUser) throw new AppError(404, "Editor not found.", "USER_NOT_FOUND");
  if ((editorUser as any).role !== "EDITOR") {
    throw new AppError(400, "Assigned user must have EDITOR role.", "VALIDATION_ERROR");
  }
  if ((editorUser as any).active === false) {
    throw new AppError(409, "Editor is inactive.", "USER_INACTIVE");
  }

  const existingEditor = await SeriesMemberModel.findOne({
    seriesId,
    role: "editor",
    status: "active",
  }).lean();
  if (existingEditor) {
    throw new AppError(
      409,
      "Series already has an active Tantou Editor. Remove the current editor after clearing workload first.",
      "ALREADY_ASSIGNED",
    );
  }
  const legacyEditor = series.editorId
    ? await UserModel.findOne({
        id: String(series.editorId),
        role: "EDITOR",
        active: { $ne: false },
      }).lean()
    : null;
  if (legacyEditor) {
    throw new AppError(
      409,
      "Series already has an active Tantou Editor. Remove the current editor after clearing workload first.",
      "ALREADY_ASSIGNED",
    );
  }

  const now = nowIso();
  let member: any;
  try {
    member = await runWorkflowTransaction(async (session) => {
    const active = await SeriesMemberModel.findOne({
      seriesId,
      role: "editor",
      status: "active",
    }).session(session).lean();
    if (active) {
      throw new AppError(409, "Series already has an active Tantou Editor.", "ALREADY_ASSIGNED");
    }
    const historical = await SeriesMemberModel.findOne({ seriesId, userId: editorId, role: "editor" })
      .session(session)
      .lean();
    const created = historical
      ? await SeriesMemberModel.findOneAndUpdate(
          { id: (historical as any).id },
          { $set: { status: "active", scope: "full_series", updatedAt: now } },
          { returnDocument: "after", session },
        )
      : (await SeriesMemberModel.create(
          [{
            id: id("sm"),
            seriesId,
            userId: editorId,
            role: "editor",
            scope: "full_series",
            status: "active",
            assignedChapterIds: [],
            assignedTaskIds: [],
            createdAt: now,
            updatedAt: now,
          }],
          { session },
        ))[0];
    await SeriesModel.updateOne(
      { id: seriesId },
      { $set: { editorId, editorName: (editorUser as any).name, updatedAt: now } },
      { session },
    );
    return created;
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new AppError(409, "Series already has an active Tantou Editor.", "ALREADY_ASSIGNED");
    }
    throw error;
  }

  await audit(req, "series.editor_assign", "series", seriesId, {
    editorId,
    editorName: (editorUser as any).name,
  });
  return toObject(member);
}

export async function removeTantouEditor(req: AuthedRequest, seriesId: string) {
  const series = (await SeriesModel.findOne({ id: seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  assertOwningMangaka(req, series);

  const now = nowIso();
  let member: any;
  await runWorkflowTransaction(async (session) => {
    member = await SeriesMemberModel.findOne({
      seriesId,
      role: "editor",
      status: "active",
    })
      .session(session)
      .lean();
    if (!member) {
      const legacyEditor = series.editorId
        ? await UserModel.findOne({
            id: String(series.editorId),
            role: "EDITOR",
            active: { $ne: false },
          })
            .session(session)
            .lean()
        : null;
      if (!legacyEditor) throw new AppError(404, "No active Tantou Editor found.", "EDITOR_NOT_FOUND");
      member = {
        id: `legacy-sm-${seriesId}-${(legacyEditor as any).id}`,
        userId: (legacyEditor as any).id,
        legacy: true,
      };
    }

    const blockers = await findTantouWorkloadBlockers(seriesId, session);
    if (blockers.length > 0) {
      throw new AppError(
        409,
        "Tantou Editor has open workload that must be reassigned or completed first.",
        "EDITOR_WORKLOAD_EXISTS",
        { blockers },
      );
    }

    if (!(member as any).legacy) {
      const result = await SeriesMemberModel.updateOne(
        { id: (member as any).id, seriesId, role: "editor", status: "active" },
        { $set: { status: "inactive", updatedAt: now } },
        { session },
      );
      if (result.modifiedCount !== 1) {
        throw new AppError(409, "Tantou Editor changed while removing.", "VERSION_CONFLICT");
      }
    }
    await SeriesModel.updateOne(
      { id: seriesId },
      { $set: { editorId: "", editorName: "", updatedAt: now } },
      { session },
    );
  });

  await audit(req, "series.editor_remove", "series", seriesId, {
    editorId: (member as any).userId,
  });
  return { id: (member as any).id, seriesId };
}
