import { AppError } from "../../shared/errors/AppError.js"
import type { UserRole } from "../auth/auth.types.js"
import {
  createSeriesRepository,
  getSeriesById,
  getSeriesForActor,
  listSeriesForActor,
  submitSeriesRepository,
  createManuscriptUploadDraft,
} from "./series.repository.js"
import { createPresignedUploadUrl } from "../chapter/file.service.js"

export interface CreateSeriesServiceInput {
  title: string
  synopsis: string
  genres?: string[]
  ownerId: string
}

export async function listSeriesService(userId: string, role: UserRole) {
  try {
    return await listSeriesForActor(userId, role)
  } catch {
    throw new AppError("Assistants cannot list Series; access is task-scoped only", 403)
  }
}

export async function getSeriesDetailService(seriesId: string, userId: string, role: UserRole) {
  try {
    const series = await getSeriesForActor(seriesId, userId, role)
    if (!series) throw new AppError("Series not found", 404)
    return series
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError("Series access denied", 403)
  }
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


export interface CreateManuscriptUploadServiceInput {
  seriesId: string
  userId: string
  originalName: string
  contentType: string
  size: number
  expiresIn?: number
}

export async function createManuscriptUploadService(input: CreateManuscriptUploadServiceInput) {
  const series = await getSeriesById(input.seriesId)
  if (!series) throw new AppError("Series not found", 404)
  if (series.ownerId.toString() !== input.userId) {
    throw new AppError("Only the series owner can upload manuscripts", 403)
  }

  const signed = await createPresignedUploadUrl(input.originalName, input.contentType, input.expiresIn)
  const persisted = await createManuscriptUploadDraft({
    seriesId: input.seriesId,
    uploadedBy: input.userId,
    r2Key: signed.r2Key,
    originalName: input.originalName,
    mimeType: input.contentType,
    size: input.size,
  })

  return {
    uploadUrl: signed.uploadUrl,
    fileAssetId: persisted.fileAsset.id,
    manuscriptId: persisted.manuscript.id,
    expiresIn: signed.expiresIn,
  }
}

export async function submitSeriesService(seriesId: string, userId: string) {
  const trimmed = seriesId.trim()
  if (!trimmed) throw new AppError("Series id is required", 400)

  let series
  try {
    series = await getSeriesById(trimmed)
  } catch {
    throw new AppError("Series not found", 404)
  }
  if (!series) throw new AppError("Series not found", 404)

  try {
    return await submitSeriesRepository(trimmed, userId)
  } catch (error) {
    const message = String((error as Error).message ?? "")
    if (message.includes("Only the owner Mangaka")) throw new AppError("Only the owner Mangaka can submit this series", 403)
    if (message.includes("Only draft series")) throw new AppError("Only draft series can be submitted", 409)
    if (message.includes("Initial manuscript")) throw new AppError("Initial manuscript is required before submit", 400)
    if (message.includes("Required series fields")) throw new AppError("Required series fields must be completed before submit", 400)
    if (message.includes("Series not found")) throw new AppError("Series not found", 404)
    throw new AppError("Unable to submit series", 400)
  }
}

