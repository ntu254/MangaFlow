import { ChapterModel, SeriesModel } from "../../../db/models.js";
import { id, nowIso } from "../../../domain/ids.js";
import { AppError } from "../../../lib/http.js";
import type { AuthedRequest } from "../../../types.js";

async function assertMangakaOwnsPage(req: AuthedRequest, pageId: string) {
  const chapter = (await ChapterModel.findOne({ "pages.id": pageId }).lean()) as any;
  if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");

  const series = (await SeriesModel.findOne({ id: chapter.seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  if (req.actor?.role !== "MANGAKA" || series.authorId !== req.actor.id) {
    throw new AppError(
      403,
      "Only the owning Mangaka can modify this Series production data.",
      "MANGAKA_OWNER_REQUIRED",
    );
  }

  return chapter;
}

export async function createChapterPage(req: AuthedRequest, chapterId: string, body: any) {
  const chapter = await ChapterModel.findOne({ id: chapterId });
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");

  const series = (await SeriesModel.findOne({ id: (chapter as any).seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  if (req.actor?.role !== "MANGAKA" || series.authorId !== req.actor.id) {
    throw new AppError(403, "Only the series Mangaka can create pages.", "MANGAKA_OWNER_REQUIRED");
  }

  const hasPageAsset = Boolean(body.fileKey || body.fileUrl || body.imageUrl);
  const newPage = {
    id: body.id ?? id("pg"),
    pageNumber: Number(body.pageNumber ?? ((chapter as any).pages?.length ?? 0) + 1),
    status: body.status ?? (hasPageAsset ? "UPLOADED" : "PENDING_UPLOAD"),
    imageUrl: body.imageUrl ?? body.fileUrl ?? "metadata://r2/placeholder-page.png",
    fileKey: body.fileKey,
    fileName: body.fileName,
    fileUrl: body.fileUrl ?? body.imageUrl,
    sizeKB: body.sizeKB,
    mimeType: body.mimeType,
    imageWidth: body.imageWidth,
    imageHeight: body.imageHeight,
    uploadedAt: nowIso(),
  };

  await ChapterModel.updateOne(
    { id: chapterId },
    { $push: { pages: newPage }, $set: { updatedAt: nowIso() } },
  );

  return newPage;
}

export async function updatePage(req: AuthedRequest, pageId: string, body: Record<string, unknown>) {
  const chapter = await assertMangakaOwnsPage(req, pageId);
  const pages = (chapter as any).pages.map((page: any) =>
    page.id === pageId ? { ...page, ...body, updatedAt: nowIso() } : page,
  );

  await ChapterModel.updateOne({ id: chapter.id }, { $set: { pages, updatedAt: nowIso() } });
  return pages.find((page: any) => page.id === pageId);
}

export async function deletePage(req: AuthedRequest, pageId: string) {
  const chapter = await assertMangakaOwnsPage(req, pageId);

  await ChapterModel.updateOne(
    { id: chapter.id },
    { $pull: { pages: { id: pageId } }, $set: { updatedAt: nowIso() } },
  );

  return { id: pageId };
}
