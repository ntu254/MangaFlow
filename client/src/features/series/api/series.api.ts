import { apiRequest } from "@/shared/api/client"
import type { CreateSeriesInput, Series } from "./series.types"

export function listSeries() {
  return apiRequest<Series[]>("/series")
}

export function getSeries(id: string) {
  return apiRequest<Series>(`/series/${id}`)
}

export function createSeries(input: CreateSeriesInput) {
  return apiRequest<Series>("/series", {
    method: "POST",
    body: JSON.stringify(input),
  })
}


export interface CreateManuscriptUploadInput {
  originalName: string
  contentType: string
  size: number
}

export interface ManuscriptUploadUrl {
  uploadUrl: string
  fileAssetId: string
  manuscriptId: string
  expiresIn: number
}

export function createManuscriptUpload(seriesId: string, input: CreateManuscriptUploadInput) {
  return apiRequest<ManuscriptUploadUrl>(`/series/${seriesId}/manuscripts/uploads`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function submitSeries(seriesId: string) {
  return apiRequest<Series>(`/series/${seriesId}/submit`, {
    method: "POST",
  })
}