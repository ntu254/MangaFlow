import {
  ChapterModel,
  SeriesMemberModel,
  SeriesModel,
  StudioTaskModel,
} from "../db/models.js";
import { AppError } from "../lib/http.js";
import type { RequestActor } from "../types.js";

type ReadSeriesOptions = {
  allowBoardGovernance?: boolean;
};

function asUnique(values: Array<string | undefined | null>) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function readNotFound() {
  throw new AppError(404, "Resource not found.", "NOT_FOUND");
}

export async function assistantReadableSeriesIds(actorId: string) {
  const [memberships, directTasks, chapterTasks] = await Promise.all([
    SeriesMemberModel.find({ userId: actorId, status: "active" }).select({ seriesId: 1 }).lean(),
    StudioTaskModel.find({
      assigneeId: actorId,
      status: { $ne: "CANCELLED" },
      seriesId: { $exists: true, $ne: "" },
    })
      .select({ seriesId: 1 })
      .lean(),
    StudioTaskModel.find({
      assigneeId: actorId,
      status: { $ne: "CANCELLED" },
      $or: [{ seriesId: { $exists: false } }, { seriesId: "" }, { seriesId: null }],
      chapterId: { $exists: true, $ne: "" },
    })
      .select({ chapterId: 1 })
      .lean(),
  ]);

  const chapterIds = asUnique(chapterTasks.map((task: any) => task.chapterId));
  const taskChapters =
    chapterIds.length > 0
      ? await ChapterModel.find({ id: { $in: chapterIds } }).select({ seriesId: 1 }).lean()
      : [];

  return asUnique([
    ...memberships.map((membership: any) => membership.seriesId),
    ...directTasks.map((task: any) => task.seriesId),
    ...taskChapters.map((chapter: any) => chapter.seriesId),
  ]);
}

export async function readableSeriesIdsForActor(
  actor: RequestActor,
  options: ReadSeriesOptions = {},
) {
  if (actor.role === "MANGAKA") {
    const series = await SeriesModel.find({ authorId: actor.id }).select({ id: 1 }).lean();
    return series.map((item: any) => String(item.id));
  }
  if (actor.role === "EDITOR") {
    const series = await SeriesModel.find({ editorId: actor.id }).select({ id: 1 }).lean();
    return series.map((item: any) => String(item.id));
  }
  if (actor.role === "ASSISTANT") {
    return assistantReadableSeriesIds(actor.id);
  }
  if (actor.role === "BOARD" && options.allowBoardGovernance) {
    const series = await SeriesModel.find({}).select({ id: 1 }).lean();
    return series.map((item: any) => String(item.id));
  }
  return [];
}

export async function canReadSeries(
  actor: RequestActor,
  series: any,
  options: ReadSeriesOptions = {},
) {
  if (!series) return false;
  if (actor.role === "MANGAKA") return series.authorId === actor.id;
  if (actor.role === "EDITOR") return series.editorId === actor.id;
  if (actor.role === "ASSISTANT") {
    const ids = await assistantReadableSeriesIds(actor.id);
    return ids.includes(String(series.id));
  }
  if (actor.role === "BOARD") return Boolean(options.allowBoardGovernance);
  return false;
}

export async function assertCanReadSeries(
  actor: RequestActor,
  seriesId: string,
  options: ReadSeriesOptions = {},
) {
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series) readNotFound();
  if (!(await canReadSeries(actor, series, options))) readNotFound();
  return series;
}

export async function assertCanReadChapter(actor: RequestActor, chapterId: string) {
  const chapter = await ChapterModel.findOne({ id: chapterId }).lean();
  if (!chapter) readNotFound();
  await assertCanReadSeries(actor, String((chapter as any).seriesId));
  return chapter;
}

export async function assertCanReadPage(actor: RequestActor, pageId: string) {
  const chapter = await ChapterModel.findOne({ "pages.id": pageId }).lean();
  if (!chapter) readNotFound();
  await assertCanReadSeries(actor, String((chapter as any).seriesId));
  const page = ((chapter as any).pages ?? []).find((item: any) => item.id === pageId);
  if (!page) readNotFound();
  return { chapter, page };
}

export async function scopedSeriesFilterForActor(
  actor: RequestActor,
  requestedSeriesId?: string,
  options: ReadSeriesOptions = {},
) {
  const ids = await readableSeriesIdsForActor(actor, options);
  const scopedIds = requestedSeriesId ? ids.filter((id) => id === requestedSeriesId) : ids;
  return { seriesIds: scopedIds, filter: { seriesId: { $in: scopedIds } } };
}

export async function scopedChapterIdsForActor(actor: RequestActor, requestedSeriesId?: string) {
  const { seriesIds } = await scopedSeriesFilterForActor(actor, requestedSeriesId);
  if (seriesIds.length === 0) return [];
  const chapters = await ChapterModel.find({ seriesId: { $in: seriesIds } })
    .select({ id: 1 })
    .lean();
  return chapters.map((chapter: any) => String(chapter.id));
}
