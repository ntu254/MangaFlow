import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { listChaptersBySeries, type Chapter } from "@/features/chapter/api/chapter.api"
import { getSeries } from "../api/series.api"
import type { Series } from "../api/series.types"
import { CHAPTER_READY_STATUSES, toChapterRows } from "../utils/series-detail.mappers"

export function useSeriesDetail() {
  const { id } = useParams()
  const [series, setSeries] = useState<Series | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedManuscripts, setSelectedManuscripts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [chapterLoading, setChapterLoading] = useState(true)
  const [chapterError, setChapterError] = useState("")
  const [error, setError] = useState("")

  const loadSeries = useCallback(async () => {
    if (!id) {
      setError("Missing Series id.")
      setLoading(false)
      setChapterLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await getSeries(id)
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load Series.")
        setSeries(null)
        return
      }
      setSeries(response.data)
    } catch {
      setError("Could not reach MangaFlow. Check the API server and try again.")
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadChapters = useCallback(async () => {
    if (!id) {
      setChapterLoading(false)
      return
    }

    setChapterLoading(true)
    setChapterError("")
    try {
      const response = await listChaptersBySeries(id)
      if (!response.success || !response.data) {
        setChapterError(response.message ?? "Could not load chapters.")
        setChapters([])
        return
      }
      setChapters(response.data)
    } catch {
      setChapterError("Could not reach MangaFlow chapters API.")
      setChapters([])
    } finally {
      setChapterLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadSeries()
    void loadChapters()
  }, [loadSeries, loadChapters])

  const canCreateChapter = Boolean(series && CHAPTER_READY_STATUSES.has(series.status))
  const chapterRows = useMemo(() => toChapterRows(chapters), [chapters])

  return {
    id,
    series,
    chapters,
    selectedManuscripts,
    loading,
    chapterLoading,
    chapterError,
    error,
    canCreateChapter,
    chapterRows,
    setSelectedManuscripts,
    loadSeries,
    loadChapters,
  }
}
