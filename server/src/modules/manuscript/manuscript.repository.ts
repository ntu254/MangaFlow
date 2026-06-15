import { Manuscript, Series } from "../series/series.model.js"
import type { ManuscriptStatus, SeriesStatus } from "../../shared/workflow/status.js"

export async function getManuscriptById(manuscriptId: string) {
  return Manuscript.findById(manuscriptId)
}

export async function getSeriesForManuscript(seriesId: string) {
  return Series.findById(seriesId)
}

export async function updateManuscriptReviewStatus(
  manuscriptId: string,
  status: ManuscriptStatus,
  reviewNote?: string,
) {
  return Manuscript.findByIdAndUpdate(
    manuscriptId,
    { status, reviewNote },
    { new: true },
  )
}

export async function updateSeriesReviewStatus(seriesId: string, status: SeriesStatus) {
  return Series.findByIdAndUpdate(seriesId, { status }, { new: true })
}
