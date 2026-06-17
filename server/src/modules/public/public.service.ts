import { AppError } from "../../shared/errors/AppError.js"
import { getPublicChapterBySlug, getPublicPagesByChapterId, getPublicSeriesBySlug, getPublishedChaptersBySeriesId } from "./public.repository.js"
import { ReaderMetric } from "./reader-metric.model.js"

export async function getPublicSeriesService(slug: string) {
  const series = await getPublicSeriesBySlug(slug)
  if (!series) {
    throw new AppError("Series not found", 404)
  }

  const chapters = await getPublishedChaptersBySeriesId(String(series._id ?? series.id))
  
  return {
    ...series.toObject(),
    chapters,
  }
}

export async function getPublicChapterService(slug: string) {
  const chapter = await getPublicChapterBySlug(slug)
  if (!chapter) {
    throw new AppError("Chapter not found or not published", 404)
  }
  return chapter
}

export async function getPublicChapterPagesService(chapterId: string) {
  // Only fetching approved pages
  const pages = await getPublicPagesByChapterId(chapterId)
  if (!pages || pages.length === 0) {
    throw new AppError("Pages not found", 404)
  }
  return pages
}

export async function recordReaderMetricsService(input: { chapterId: string, seriesId: string, viewDurationSeconds?: number, ipAddress?: string }) {
  const metric = new ReaderMetric({
    chapterId: input.chapterId,
    seriesId: input.seriesId,
    viewDurationSeconds: input.viewDurationSeconds,
    ipAddress: input.ipAddress,
  })
  await metric.save()
  return metric
}
