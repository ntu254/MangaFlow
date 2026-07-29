import { ChapterModel, SeriesModel } from "../db/models.js";
import { AppError, asyncRoute, ok } from "../lib/http.js";
import { createDisplayUrl } from "../services/file-access.service.js";

function publicAssetUrl(fileKey?: string, fallbackUrl?: string) {
  if (fileKey) return createDisplayUrl(fileKey).url;
  return fallbackUrl ?? "";
}

function publicChapterSummary(chapter: any) {
  return {
    id: chapter.id,
    number: chapter.number,
    title: chapter.title,
    summary: chapter.summary ?? "",
    publishedAt: chapter.publishedAt,
    pageCount: Array.isArray(chapter.pages) ? chapter.pages.length : 0,
  };
}

async function findPublicSeries(slug: string) {
  const series = await SeriesModel.findOne({
    slug,
    visibility: "PUBLIC",
    deletedAt: { $exists: false },
  }).lean();
  if (!series) {
    throw new AppError(404, "Published series not found.", "PUBLIC_SERIES_NOT_FOUND");
  }
  return series as any;
}

async function publishedChapters(seriesId: string) {
  return ChapterModel.find({ seriesId, status: "PUBLISHED" })
    .sort({ number: 1 })
    .lean();
}

function publicSeriesPayload(series: any, chapters: any[]) {
  return {
    id: series.id,
    slug: series.slug,
    title: series.title,
    synopsis: series.synopsis ?? "",
    genres: Array.isArray(series.genres) ? series.genres : [],
    authorName: series.authorName ?? "",
    coverUrl: publicAssetUrl(series.coverFileKey, series.coverUrl),
    status: series.status,
    publicationType: series.publicationType,
    publishedAt: series.publishedAt,
    chapters: chapters.map(publicChapterSummary),
  };
}

export const listPublicSeries = asyncRoute(async (_req, res) => {
  const candidates = await SeriesModel.find({
    visibility: "PUBLIC",
    deletedAt: { $exists: false },
  })
    .sort({ publishedAt: -1, updatedAt: -1 })
    .lean();

  const entries = await Promise.all(
    candidates.map(async (series: any) => {
      const chapters = await publishedChapters(series.id);
      return chapters.length > 0 ? publicSeriesPayload(series, chapters) : null;
    }),
  );

  ok(
    res,
    entries.filter(
      (entry): entry is NonNullable<typeof entry> => entry !== null,
    ),
  );
});

export const getPublicSeries = asyncRoute(async (req, res) => {
  const series = await findPublicSeries(String(req.params.slug));
  const chapters = await publishedChapters(series.id);
  if (chapters.length === 0) {
    throw new AppError(404, "Published series not found.", "PUBLIC_SERIES_NOT_FOUND");
  }
  ok(res, publicSeriesPayload(series, chapters));
});

export const getPublicChapter = asyncRoute(async (req, res) => {
  const series = await findPublicSeries(String(req.params.slug));
  const chapterNumber = Number(req.params.chapterNumber);
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
    throw new AppError(404, "Published chapter not found.", "PUBLIC_CHAPTER_NOT_FOUND");
  }

  const [chapter, chapters] = await Promise.all([
    ChapterModel.findOne({
      seriesId: series.id,
      number: chapterNumber,
      status: "PUBLISHED",
    }).lean(),
    publishedChapters(series.id),
  ]);
  if (!chapter) {
    throw new AppError(404, "Published chapter not found.", "PUBLIC_CHAPTER_NOT_FOUND");
  }

  const pages = Array.isArray((chapter as any).pages)
    ? [...(chapter as any).pages].sort(
        (left: any, right: any) =>
          Number(left.index ?? left.pageNumber ?? 0) -
          Number(right.index ?? right.pageNumber ?? 0),
      )
    : [];

  ok(res, {
    series: publicSeriesPayload(series, chapters),
    chapter: {
      ...publicChapterSummary(chapter),
      pages: pages.map((page: any, index: number) => ({
        id: page.id,
        pageNumber: Number(page.pageNumber ?? index + 1),
        imageUrl: publicAssetUrl(page.fileKey, page.fileUrl ?? page.imageUrl),
        imageWidth: page.imageWidth,
        imageHeight: page.imageHeight,
      })),
    },
  });
});
