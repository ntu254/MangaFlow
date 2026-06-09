import type { Series } from "../api/series.types"

export interface SeriesRow {
  id: string
  title: string
  status: Series["status"]
  genre: string
  publicationType: string
  description: string
  ownerLabel: string
  metadata: string[]
  canCreateChapter: boolean
}

export interface UploadOption {
  value: string
  label: string
}

export const CHAPTER_READY_STATUSES = new Set(["APPROVED", "ONGOING", "AT_RISK"])

export function toSeriesRows(seriesList: Series[], currentUserId?: string): SeriesRow[] {
  return seriesList.map((series) => ({
    id: series.id,
    title: series.title,
    status: series.status,
    genre: series.genres.length > 0 ? series.genres.join(", ") : "Unclassified",
    publicationType: "Not supplied yet",
    description: series.synopsis,
    ownerLabel: series.ownerId === currentUserId ? "Current Mangaka" : "Series owner",
    metadata: [`Slug: ${series.slug}`, `Updated: ${new Date(series.updatedAt).toLocaleDateString()}`],
    canCreateChapter: CHAPTER_READY_STATUSES.has(series.status),
  }))
}

export function toUploadOptions(seriesList: Series[]): UploadOption[] {
  return seriesList.map((series) => ({ value: series.id, label: series.title }))
}
