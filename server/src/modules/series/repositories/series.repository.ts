import { Series, SeriesMember } from "../series.model.js"
import type { SeriesStatus } from "../../../shared/workflow/status.js"
import { buildSlug } from "../utils/series-slug.js"

export type SeriesMemberRole = "MANGAKA" | "ASSISTANT" | "EDITOR"

export interface CreateSeriesInput {
  title: string
  synopsis: string
  genres?: string[]
  ownerId: string
}

export interface CreateSeriesResult {
  id: string
  title: string
  slug: string
  synopsis: string
  genres: string[]
  ownerId: string
  status: SeriesStatus
  createdAt: Date
  updatedAt: Date
}

export const BOARD_VISIBLE_STATUSES: SeriesStatus[] = ["BOARD_REVIEW", "APPROVED", "ONGOING", "AT_RISK", "REJECTED", "CANCELLED", "COMPLETED"]

export async function createSeriesRepository(input: CreateSeriesInput): Promise<CreateSeriesResult> {
  const slug = buildSlug(input.title)
  const series = await Series.create({
    title: input.title,
    slug,
    synopsis: input.synopsis,
    genres: input.genres ?? [],
    ownerId: input.ownerId,
    status: "DRAFT",
  })

  await SeriesMember.create({
    seriesId: series.id,
    userId: input.ownerId,
    role: "MANGAKA",
    isActive: true,
  })

  return {
    id: series.id,
    title: series.title,
    slug: series.slug,
    synopsis: series.synopsis,
    genres: series.genres,
    ownerId: String(series.ownerId),
    status: series.status as SeriesStatus,
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
  }
}

export async function listSeriesForActor(userId: string, role: string): Promise<any[]> {
  if (role === "ASSISTANT") {
    throw new Error("Assistants cannot list Series; access is task-scoped only")
  }

  const filter = role === "MANGAKA"
    ? { ownerId: userId }
    : role === "BOARD"
      ? { status: { $in: BOARD_VISIBLE_STATUSES } }
      : {}
  return Series.find(filter).sort({ updatedAt: -1 })
}

export async function getSeriesForActor(seriesId: string, userId: string, role: string): Promise<any | null> {
  const series = await Series.findById(seriesId)
  if (!series) return null

  const isBoardVisible = role === "BOARD" && BOARD_VISIBLE_STATUSES.includes(series.status as SeriesStatus)
  const canViewAll = role === "ADMIN" || role === "EDITOR" || isBoardVisible
  if (!canViewAll && String(series.ownerId) !== userId) {
    throw new Error("Series access denied")
  }

  return series
}

export async function getSeriesById(seriesId: string): Promise<any | null> {
  return Series.findById(seriesId)
}

export async function updateSeriesStatus(seriesId: string, status: SeriesStatus): Promise<any | null> {
  return Series.findByIdAndUpdate(seriesId, { status }, { new: true })
}
