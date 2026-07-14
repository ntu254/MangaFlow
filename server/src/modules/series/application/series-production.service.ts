import { ChapterModel, SeriesModel } from "../../../db/models.js";
import { id, nowIso } from "../../../domain/ids.js";
import { AppError } from "../../../lib/http.js";
import { audit } from "../../../services/audit.service.js";
import type { AuthedRequest } from "../../../types.js";
import { rejectProtectedFields } from "../../../validators/common.js";

export function rejectManualSeriesCreation(): never {
  throw new AppError(
    403,
    "Series are created only after the Board approves a Proposal with a Tantou Editor and publication type.",
    "SERIES_CREATION_WORKFLOW_REQUIRED",
  );
}

export async function createSeriesChapter(req: AuthedRequest, seriesId: string, body: any) {
  const now = nowIso();
  rejectProtectedFields(body as Record<string, unknown>);

  const series = (await SeriesModel.findOne({ id: seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");

  if (req.actor?.role !== "MANGAKA" || series.authorId !== req.actor.id) {
    throw new AppError(403, "Only the series Mangaka can create chapters.", "MANGAKA_OWNER_REQUIRED");
  }

  if (["CANCELLED", "HIATUS", "COMPLETED"].includes(String(series.status))) {
    throw new AppError(
      409,
      `Cannot create a chapter for a ${String(series.status).toLowerCase()} series.`,
      "SERIES_NOT_PRODUCIBLE",
    );
  }

  const chapter = await ChapterModel.create({
    id: id("ch"),
    seriesId,
    number: Number(body.number ?? 1),
    title: body.title ?? "Untitled chapter",
    status: "PLANNED",
    assigneeId: body.assigneeId ?? req.actor?.id,
    assigneeName: body.assigneeName ?? req.actor?.name,
    draftDueAt: body.draftDueAt ? new Date(body.draftDueAt) : undefined,
    reviewDueAt: body.reviewDueAt ? new Date(body.reviewDueAt) : undefined,
    plannedAt: body.plannedAt ? new Date(body.plannedAt) : undefined,
    pages: [],
    reviewNotes: [],
    revisionRound: 0,
    history: [],
    createdAt: now,
    updatedAt: now,
  });

  await audit(req, "chapter.create", "chapter", (chapter as any).id);
  return chapter;
}
