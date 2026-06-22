import { AppError } from "../../shared/errors/AppError.js"
import { getPublicChapterBySlug, getPublicPagesByChapterId, getPublicSeriesBySlug, getPublishedChaptersBySeriesId } from "./public.repository.js"
import { ReaderMetric } from "./reader-metric.model.js"
import { createPresignedDownloadUrl } from "../chapter/file.service.js"

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
  return Promise.all(
    pages.map(async (page: any) => {
      const imageAsset = page.workingFileAssetId ?? page.originalFileAssetId ?? page.thumbnailFileAssetId
      if (!imageAsset?.r2Key) {
        throw new AppError("Published page is missing an image asset", 500)
      }
      const signed = await createPresignedDownloadUrl(imageAsset.r2Key, 3600)
      return {
        id: String(page._id),
        order: page.pageNumber ?? page.order,
        pageNumber: page.pageNumber ?? page.order,
        width: page.width,
        height: page.height,
        imageUrl: signed.downloadUrl,
        expiresIn: signed.expiresIn,
      }
    }),
  )
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
