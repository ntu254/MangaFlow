import { Series, SeriesMember, Manuscript } from "./series.model.js"

export type SeriesStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "EDITOR_REVIEW"
  | "REVISION_REQUESTED"
  | "BOARD_REVIEW"
  | "APPROVED"
  | "ONGOING"
  | "AT_RISK"
  | "CANCELLED"
  | "COMPLETED"
  | "REJECTED"

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

export async function getSeriesById(seriesId: string): Promise<any | null> {
  return Series.findById(seriesId)
}

export async function hasManuscript(seriesId: string): Promise<boolean> {
  const existing = await Manuscript.exists({ seriesId })
  return Boolean(existing)
}

export async function submitSeriesRepository(seriesId: string, userId: string): Promise<any> {
  const series = await Series.findById(seriesId)
  if (!series) {
    throw new Error("Series not found")
  }

  if (String(series.ownerId) !== userId) {
    throw new Error("Only the owner Mangaka can submit this series")
  }

  if (series.status !== "DRAFT") {
    throw new Error("Only draft series can be submitted")
  }

  if (!series.title || !series.synopsis) {
    throw new Error("Required series fields must be completed before submit")
  }

  const [manuscript] = await Promise.all([
    hasManuscript(seriesId),
    Promise.resolve(),
  ])

  if (!manuscript) {
    throw new Error("Initial manuscript is required before submit")
  }

  series.status = "EDITOR_REVIEW"
  await series.save()

  return series
}

function buildSlug(title: string): string {
  let base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)

  if (!base) {
    base = "series"
  }

  return base
}
