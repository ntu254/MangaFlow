import { AppError } from "../../shared/errors/AppError.js"
import { createSeriesRepository, getSeriesById, submitSeriesRepository } from "./series.repository.js"

export interface CreateSeriesServiceInput {
  title: string
  synopsis: string
  genres?: string[]
  ownerId: string
}

export async function createSeriesService(input: CreateSeriesServiceInput) {
  if (!input.title?.trim() || !input.synopsis?.trim()) {
    throw new AppError("Title and synopsis are required", 400)
  }

  return createSeriesRepository({
    title: input.title.trim(),
    synopsis: input.synopsis.trim(),
    genres: input.genres,
    ownerId: input.ownerId,
  })
}

export async function submitSeriesService(seriesId: string, userId: string) {
  const trimmed = seriesId.trim()
  if (!trimmed) {
    throw new AppError("Series id is required", 400)
  }

  let series
  try {
    series = await getSeriesById(trimmed)
  } catch (error) {
    throw new AppError("Series not found", 404)
  }

  if (!series) {
    throw new AppError("Series not found", 404)
  }

  try {
    return await submitSeriesRepository(trimmed, userId)
  } catch (error) {
    const message = String((error as Error).message ?? "")

    if (message.includes("Only the owner Mangaka")) {
      throw new AppError("Only the owner Mangaka can submit this series", 403)
    }
    if (message.includes("Only draft series")) {
      throw new AppError("Only draft series can be submitted", 409)
    }
    if (message.includes("Initial manuscript")) {
      throw new AppError("Initial manuscript is required before submit", 400)
    }
    if (message.includes("Required series fields")) {
      throw new AppError("Required series fields must be completed before submit", 400)
    }
    if (message.includes("Series not found")) {
      throw new AppError("Series not found", 404)
    }

    throw new AppError("Unable to submit series", 400)
  }
}
