import slugify from "slugify"
import { AppError } from "../../shared/errors/AppError.js"
import { Manuscript, Series, SeriesMember } from "./series.model.js"
import type { CreateSeriesInput } from "./series.validation.js"

async function createUniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title, { lower: true, strict: true, trim: true }) || "series"
  let slug = baseSlug
  let suffix = 2

  while (await Series.findOne({ slug })) {
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }

  return slug
}

export async function createSeriesProposal(input: CreateSeriesInput, ownerId: string) {
  const slug = await createUniqueSlug(input.title)
  const series = await Series.create({
    title: input.title,
    slug,
    synopsis: input.synopsis,
    genres: input.genres,
    ownerId,
    status: "DRAFT",
  })

  await SeriesMember.create({
    seriesId: series.id,
    userId: ownerId,
    role: "MANGAKA",
    isActive: true,
  })

  return series
}

export async function submitSeriesProposal(seriesId: string, userId: string) {
  const series = await Series.findById(seriesId)
  if (!series) {
    throw new AppError("Series not found", 404)
  }

  if (String(series.ownerId) !== userId) {
    throw new AppError("Only the owner Mangaka can submit this series", 403)
  }

  if (series.status !== "DRAFT") {
    throw new AppError("Only draft series can be submitted", 409)
  }

  if (!series.title || !series.synopsis) {
    throw new AppError("Required series fields must be completed before submit", 400)
  }

  const manuscript = await Manuscript.exists({ seriesId })
  if (!manuscript) {
    throw new AppError("Initial manuscript is required before submit", 400)
  }

  series.status = "EDITOR_REVIEW"
  await series.save()

  return series
}
