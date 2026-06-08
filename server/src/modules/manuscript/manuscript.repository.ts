import { Manuscript, Series } from "../series/series.model.js"

export async function getManuscriptWithSeries(manuscriptId: string): Promise<any | null> {
  const manuscript = await Manuscript.findById(manuscriptId)
  if (!manuscript) return null
  const series = await Series.findById(manuscript.seriesId)
  return series ? { manuscript, series } : null
}

export async function updateProposalReview(manuscriptId: string, manuscriptStatus: string, seriesId: string, seriesStatus: string) {
  const [manuscript, series] = await Promise.all([
    Manuscript.findByIdAndUpdate(manuscriptId, { status: manuscriptStatus }, { new: true }),
    Series.findByIdAndUpdate(seriesId, { status: seriesStatus }, { new: true }),
  ])
  return { manuscript, series }
}
