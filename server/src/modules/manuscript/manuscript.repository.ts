import { Manuscript, Series } from "../series/series.model.js"
import { SeriesMember } from "../series/series.model.js"
import type { ManuscriptStatus, SeriesStatus } from "../../shared/workflow/status.js"

export async function getManuscriptById(manuscriptId: string) {
  return Manuscript.findById(manuscriptId)
}

export async function getLatestManuscriptForSeries(seriesId: string) {
  return Manuscript.findOne({ seriesId }).sort({ version: -1 })
}

export async function getSeriesForManuscript(seriesId: string) {
  return Series.findById(seriesId)
}

export async function updateManuscriptReviewStatus(
  manuscriptId: string,
  status: ManuscriptStatus,
  reviewNote?: string,
  metadata?: {
    editorRecommendation?: string
    feasibilityNote?: string
    suggestedPublicationType?: string
    riskNote?: string
  },
) {
  return Manuscript.findByIdAndUpdate(
    manuscriptId,
    { status, reviewNote, ...metadata },
    { new: true },
  )
}

export async function updateSeriesReviewStatus(seriesId: string, status: SeriesStatus) {
  return Series.findByIdAndUpdate(seriesId, { status }, { new: true })
}

export async function listEditorAssignedSeriesIds(editorUserId: string) {
  const memberships = await SeriesMember.find({
    userId: editorUserId,
    role: "EDITOR",
    status: "ACTIVE",
    isActive: true,
  })
    .select("seriesId")
    .lean()
  return memberships.map((membership) => membership.seriesId)
}

export async function hasActiveEditorAssignment(seriesId: string, editorUserId: string) {
  return SeriesMember.exists({
    seriesId,
    userId: editorUserId,
    role: "EDITOR",
    status: "ACTIVE",
    isActive: true,
  })
}

export async function listEditorReviewQueue(editorUserId: string) {
  const assignedSeriesIds = await listEditorAssignedSeriesIds(editorUserId)
  if (assignedSeriesIds.length === 0) return []

  const seriesList = await Series.find({ _id: { $in: assignedSeriesIds }, status: "EDITOR_REVIEW" }).sort({ updatedAt: -1 }).lean()
  const seriesIds = seriesList.map((series) => series._id)
  const manuscripts = await Manuscript.find({ seriesId: { $in: seriesIds } }).sort({ version: -1 }).lean()
  const latestBySeries = new Map<string, any>()
  for (const manuscript of manuscripts) {
    const key = String(manuscript.seriesId)
    if (!latestBySeries.has(key)) latestBySeries.set(key, manuscript)
  }

  return seriesList.map((series) => ({
    series,
    manuscript: latestBySeries.get(String(series._id)) ?? null,
  }))
}
