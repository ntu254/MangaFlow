import { Chapter, Page } from "../chapter/chapter.model.js"
import { Series } from "../series/series.model.js"

export async function getPublicSeriesBySlug(slug: string) {
  // Only return series that are not CANCELLED
  return Series.findOne({ slug, status: { $ne: "CANCELLED" } }).select("-__v -createdAt -updatedAt")
}

export async function getPublishedChaptersBySeriesId(seriesId: string) {
  return Chapter.find({ seriesId, status: "PUBLISHED" }).sort({ order: 1 }).select("title slug order publishedAt status")
}

export async function getPublicChapterBySlug(slug: string) {
  return Chapter.findOne({ slug, status: "PUBLISHED" })
}

export async function getPublicPagesByChapterId(chapterId: string) {
  // Only return approved/uploaded pages for a published chapter
  return Page.find({ chapterId, status: "APPROVED" }).sort({ order: 1 }).select("imageUrl order width height")
}
