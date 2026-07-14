import { ChapterModel, SeriesModel } from "../../../db/models.js";
import { AppError } from "../../../lib/http.js";
import { requireActor } from "../../../controllers/helpers.js";
import type { AuthedRequest } from "../../../types.js";

export function rejectWorkflowStatusPatch(body: unknown) {
  if (body && typeof body === "object" && ("status" in body || "state" in body)) {
    throw new AppError(
      400,
      "Status cannot be changed directly. Use the appropriate action endpoint.",
      "VALIDATION_ERROR",
    );
  }
}

export async function resolveStudioSeries(input: {
  seriesId?: string;
  chapterId?: string;
  pageId?: string;
}) {
  if (input.seriesId) return SeriesModel.findOne({ id: input.seriesId }).lean();
  if (input.chapterId) {
    const chapter = await ChapterModel.findOne({ id: input.chapterId }).lean();
    return chapter ? SeriesModel.findOne({ id: (chapter as any).seriesId }).lean() : null;
  }
  if (input.pageId) {
    const chapter = await ChapterModel.findOne({ "pages.id": input.pageId }).lean();
    return chapter ? SeriesModel.findOne({ id: (chapter as any).seriesId }).lean() : null;
  }
  return null;
}

export async function assertCanManageStudio(
  req: AuthedRequest,
  input: {
    seriesId?: string;
    chapterId?: string;
    pageId?: string;
  },
) {
  const actor = requireActor(req);
  if (actor.role === "ADMIN") return;
  const series = await resolveStudioSeries(input);
  if (!series) throw new AppError(404, "Series not found for this Studio record.", "SERIES_NOT_FOUND");
  const allowed =
    (actor.role === "MANGAKA" && (series as any).authorId === actor.id) ||
    (actor.role === "EDITOR" && (series as any).editorId === actor.id);
  if (!allowed) {
    throw new AppError(403, "Only the series Mangaka or Tantou Editor can manage this record.", "FORBIDDEN");
  }
}
