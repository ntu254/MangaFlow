import {
  ChapterModel,
  ProposalModel,
  SeriesModel,
  StudioTaskModel,
  SubmissionModel,
} from "../db/models.js";
import { AppError } from "../lib/http.js";
import { assertCanReadSeries, canReadSeries } from "./mvp-access.service.js";
import type { RequestActor } from "../types.js";

export type ResolvedStudioPage = {
  chapter: any;
  page: any;
  series: any;
};

export async function resolveStudioPage(pageId: string): Promise<ResolvedStudioPage> {
  const chapter = await ChapterModel.findOne({ "pages.id": pageId }).lean();
  if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  const page = ((chapter as any).pages ?? []).find((item: any) => item.id === pageId);
  const series = await SeriesModel.findOne({ id: (chapter as any).seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  return { chapter, page, series };
}

export async function assertCanReadStudioPage(actor: RequestActor, pageId: string) {
  const resolved = await resolveStudioPage(pageId);

  if (actor.role === "ASSISTANT") {
    // An assistant assigned to a non-cancelled task on this page can read its
    // files even when they are not a full-series assistant (TASK_ONLY scope).
    const task = await StudioTaskModel.findOne({
      pageId,
      assigneeId: actor.id,
      status: { $ne: "CANCELLED" },
    }).lean();
    if (task) return resolved;
    if (await canReadSeries(actor, resolved.series)) return resolved;
    throw new AppError(404, "File not found.", "FILE_NOT_FOUND");
  }

  if (!(await canReadSeries(actor, resolved.series))) {
    throw new AppError(404, "File not found.", "FILE_NOT_FOUND");
  }

  return resolved;
}

export async function assertCanRunPageAi(actor: RequestActor, pageId: string) {
  const resolved = await resolveStudioPage(pageId);
  const canRun = actor.role === "MANGAKA" && (resolved.series as any).authorId === actor.id;
  if (!canRun) {
    throw new AppError(
      403,
      "Only the production owner can run Studio AI for this page.",
      "FORBIDDEN",
    );
  }
  return resolved;
}

export async function assertFileKeyVisible(actor: RequestActor, key: string) {
  const proposal = await ProposalModel.findOne({ coverFileKey: key }).lean();
  if (proposal) {
    const boardVisibleStatuses = new Set([
      "PENDING_BOARD",
      "BOARD_VOTING",
      "TIE_BREAK",
      "APPROVED",
      "REJECTED",
    ]);
    const canRead =
      (actor.role === "BOARD" && boardVisibleStatuses.has(String((proposal as any).status))) ||
      actor.role === "EDITOR" ||
      (actor.role === "MANGAKA" && (proposal as any).authorId === actor.id);
    if (canRead) return { chapter: null, page: null, series: null };
    throw new AppError(404, "File not found.", "FILE_NOT_FOUND");
  }

  const coverSeries = await SeriesModel.findOne({ coverFileKey: key }).lean();
  if (coverSeries) {
    if (await canReadSeries(actor, coverSeries)) {
      return { chapter: null, page: null, series: coverSeries };
    }
    throw new AppError(404, "File not found.", "FILE_NOT_FOUND");
  }

  const chapter = await ChapterModel.findOne({
    pages: { $elemMatch: { $or: [{ fileKey: key }, { "metadata.aiWhitened.fileKey": key }] } },
  }).lean();
  if (chapter) {
    const pages = ((chapter as any).pages ?? []) as any[];
    const page = pages.find(
      (item) => item.fileKey === key || item.metadata?.aiWhitened?.fileKey === key,
    );
    if (page) return assertCanReadStudioPage(actor, page.id);
  }

  const submission = (await SubmissionModel.findOne({ fileKey: key }).lean()) as any;
  if (submission?.pageId) return assertCanReadStudioPage(actor, String(submission.pageId));
  if (submission?.assistantId === actor.id) {
    return { chapter: null, page: null, series: null };
  }
  if (submission?.seriesId) {
    await assertCanReadSeries(actor, String(submission.seriesId));
    return { chapter: null, page: null, series: null };
  }
  if (submission?.chapterId) {
    const submissionChapter = await ChapterModel.findOne({ id: String(submission.chapterId) })
      .select({ seriesId: 1 })
      .lean();
    if ((submissionChapter as any)?.seriesId) {
      await assertCanReadSeries(actor, String((submissionChapter as any).seriesId));
      return { chapter: submissionChapter, page: null, series: null };
    }
  }

  throw new AppError(404, "File not found.", "FILE_NOT_FOUND");
}
