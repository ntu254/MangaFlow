import { getLatestManuscriptBySeries } from "./manuscript.repository.js"
import { Series } from "../series.model.js"

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

  const manuscript = await getLatestManuscriptBySeries(seriesId)
  if (!manuscript) {
    throw new Error("Initial manuscript is required before submit")
  }

  series.status = "EDITOR_REVIEW"
  manuscript.status = "EDITOR_REVIEW"
  await series.save()
  await manuscript.save()

  return series
}
