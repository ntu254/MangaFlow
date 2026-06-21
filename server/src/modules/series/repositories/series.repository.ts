import { Series, SeriesMember } from "../series.model.js"
import type { PublicationType, SeriesStatus } from "../../../shared/workflow/status.js"
import { buildSlug } from "../utils/series-slug.js"

export type SeriesMemberRole = "MANGAKA" | "ASSISTANT" | "EDITOR"

export interface CreateSeriesInput {
  title: string
  synopsis: string
  logline?: string
  premise?: string
  characters?: string
  conflict?: string
  targetAudience?: string
  requestedPublicationType?: PublicationType
  publicationType?: PublicationType
  tags?: string[]
  genres?: string[]
  ownerId: string
}

export interface CreateSeriesResult {
  id: string
  title: string
  slug: string
  synopsis: string
  logline?: string
  premise?: string
  characters?: string
  conflict?: string
  targetAudience?: string
  requestedPublicationType?: PublicationType
  publicationType?: PublicationType
  tags: string[]
  genres: string[]
  ownerId: string
  status: SeriesStatus
  createdAt: Date
  updatedAt: Date
}

export const BOARD_VISIBLE_STATUSES: SeriesStatus[] = ["BOARD_REVIEW", "ONGOING", "AT_RISK", "REJECTED", "CANCELLED", "COMPLETED"]

export async function createSeriesRepository(input: CreateSeriesInput): Promise<CreateSeriesResult> {
  const slug = buildSlug(input.title)
  const series = await Series.create({
    title: input.title,
    slug,
    synopsis: input.synopsis,
    logline: input.logline,
    premise: input.premise,
    characters: input.characters,
    conflict: input.conflict,
    targetAudience: input.targetAudience,
    requestedPublicationType: input.requestedPublicationType,
    publicationType: input.publicationType,
    tags: input.tags ?? [],
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
    logline: series.logline,
    premise: series.premise,
    characters: series.characters,
    conflict: series.conflict,
    targetAudience: series.targetAudience,
    requestedPublicationType: series.requestedPublicationType,
    publicationType: series.publicationType,
    tags: series.tags ?? [],
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

// ---------- Save as Draft / partial update ----------

export interface UpdateSeriesInput {
  title?: string
  synopsis?: string
  logline?: string
  premise?: string
  characters?: string
  conflict?: string
  targetAudience?: string
  requestedPublicationType?: PublicationType
  publicationType?: PublicationType
  tags?: string[]
  genres?: string[]
}

const UPDATABLE_STATUSES: SeriesStatus[] = ["DRAFT", "REVISION_REQUESTED"]

export async function updateSeriesRepository(
  seriesId: string,
  userId: string,
  input: UpdateSeriesInput,
): Promise<any> {
  const series = await Series.findById(seriesId)
  if (!series) {
    throw new Error("Series not found")
  }

  if (String(series.ownerId) !== userId) {
    throw new Error("Only the owner Mangaka can update this series")
  }

  if (!UPDATABLE_STATUSES.includes(series.status as SeriesStatus)) {
    throw new Error("Series can only be edited while in DRAFT or REVISION_REQUESTED")
  }

  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.synopsis !== undefined) patch.synopsis = input.synopsis
  if (input.logline !== undefined) patch.logline = input.logline
  if (input.premise !== undefined) patch.premise = input.premise
  if (input.characters !== undefined) patch.characters = input.characters
  if (input.conflict !== undefined) patch.conflict = input.conflict
  if (input.targetAudience !== undefined) patch.targetAudience = input.targetAudience
  if (input.requestedPublicationType !== undefined) patch.requestedPublicationType = input.requestedPublicationType
  if (input.publicationType !== undefined) patch.publicationType = input.publicationType
  if (input.tags !== undefined) patch.tags = input.tags
  if (input.genres !== undefined) patch.genres = input.genres

  // Only rebuild the slug when the title actually changes. Slugs must stay
  // unique, so leave existing one in place if title is unchanged.
  if (typeof patch.title === "string" && patch.title !== series.title) {
    patch.slug = buildSlug(patch.title as string)
  }

  Object.assign(series, patch)
  await series.save()

  return {
    id: series.id,
    title: series.title,
    slug: series.slug,
    synopsis: series.synopsis,
    logline: series.logline,
    premise: series.premise,
    characters: series.characters,
    conflict: series.conflict,
    targetAudience: series.targetAudience,
    requestedPublicationType: series.requestedPublicationType,
    publicationType: series.publicationType,
    tags: series.tags ?? [],
    genres: series.genres ?? [],
    ownerId: String(series.ownerId),
    status: series.status as SeriesStatus,
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
  }
}
