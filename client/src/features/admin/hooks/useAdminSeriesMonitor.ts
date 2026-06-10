import { useCallback, useEffect, useMemo, useState } from "react"
import { listSeries } from "@/features/series/api/series.api"
import type { Series, SeriesStatus } from "@/features/series/api/series.types"
import { toSeriesRows } from "@/features/series/utils/series-page.mappers"

export function useAdminSeriesMonitor() {
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadSeries = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await listSeries()
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load Series monitor data.")
        setSeriesList([])
        return
      }
      setSeriesList(response.data)
    } catch {
      setError("Could not reach MangaFlow Series API.")
      setSeriesList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadSeries() }, [loadSeries])

  const seriesRows = useMemo(() => toSeriesRows(seriesList), [seriesList])
  const statusCounts = useMemo(
    () =>
      seriesList.reduce<Partial<Record<SeriesStatus, number>>>((counts, series) => {
        counts[series.status] = (counts[series.status] ?? 0) + 1
        return counts
      }, {}),
    [seriesList],
  )

  const pendingReviewCount = (statusCounts.EDITOR_REVIEW ?? 0) + (statusCounts.BOARD_REVIEW ?? 0) + (statusCounts.REVISION_REQUESTED ?? 0)
  const productionCount = (statusCounts.APPROVED ?? 0) + (statusCounts.ONGOING ?? 0) + (statusCounts.AT_RISK ?? 0)

  return {
    seriesList,
    seriesRows,
    statusCounts,
    pendingReviewCount,
    productionCount,
    loading,
    error,
    loadSeries,
  }
}

