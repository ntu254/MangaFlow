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
