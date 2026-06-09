import { useCallback, useEffect, useMemo, useState } from "react"
import { createManuscriptUpload, listSeries } from "../api/series.api"
import type { Series } from "../api/series.types"
import { toSeriesRows, toUploadOptions } from "../utils/series-page.mappers"

export function useSeriesPage(currentUserId?: string) {
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [selectedManuscripts, setSelectedManuscripts] = useState<string[]>([])
  const [uploadSeriesId, setUploadSeriesId] = useState("")
  const [uploadMessage, setUploadMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadSeries = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await listSeries()
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load Series.")
        setSeriesList([])
        return
      }
      setSeriesList(response.data)
      setUploadSeriesId((current) => current || response.data?.[0]?.id || "")
    } catch {
      setError("Could not reach MangaFlow. Check the API server and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSeries()
  }, [loadSeries])

  const handleCreated = useCallback((series: Series) => {
    setSeriesList((current) => [series, ...current])
    setUploadSeriesId(series.id)
  }, [])

  const handleManuscriptFiles = useCallback(async (files: FileList) => {
    const file = files.item(0)
    if (!file) return

    setSelectedManuscripts([file.name])
    setUploadMessage("")

    if (!uploadSeriesId) {
      setUploadMessage("Select a Series before requesting a manuscript upload URL.")
      return
    }

    const response = await createManuscriptUpload(uploadSeriesId, {
      originalName: file.name,
      contentType: file.type,
      size: file.size,
    })

    if (!response.success || !response.data) {
      setUploadMessage(response.message ?? "Could not create manuscript upload URL.")
      return
    }

    setUploadMessage("Signed upload URL created. Direct file PUT is still manual/out of UI scope for this story.")
  }, [uploadSeriesId])

  const seriesRows = useMemo(() => toSeriesRows(seriesList, currentUserId), [currentUserId, seriesList])
  const uploadOptions = useMemo(() => toUploadOptions(seriesList), [seriesList])

  return {
    seriesList,
    seriesRows,
    uploadOptions,
    selectedManuscripts,
    uploadSeriesId,
    uploadMessage,
    loading,
    error,
    setUploadSeriesId,
    loadSeries,
    handleCreated,
    handleManuscriptFiles,
  }
}
