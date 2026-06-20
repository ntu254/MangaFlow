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

  if (!["DRAFT", "REVISION_REQUESTED"].includes(series.status)) {
    throw new Error("Only draft or revision-requested series can be submitted")
  }

  if (
    !series.title ||
    !series.synopsis ||
    !series.targetAudience ||
    !Array.isArray(series.genres) ||
    series.genres.length === 0
  ) {
    throw new Error("Required series fields must be completed before submit")
  }

  const manuscript = await getLatestManuscriptBySeries(seriesId)
  if (!manuscript) {
    throw new Error("Initial manuscript is required before submit")
  }
  if (manuscript.status !== "DRAFT") {
    throw new Error("A new draft manuscript version is required before submit")
  }

  series.status = "EDITOR_REVIEW"
  manuscript.status = "SUBMITTED"
  await series.save()
  await manuscript.save()

  return series
}
