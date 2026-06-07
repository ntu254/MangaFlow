import { apiRequest } from "@/shared/api/client"
import type { CreateSeriesInput, Series } from "./series.types"

export function createSeries(input: CreateSeriesInput) {
  return apiRequest<Series>("/series", {
    method: "POST",
    body: JSON.stringify(input),
  })
}
