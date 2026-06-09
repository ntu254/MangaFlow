import { useCallback, useEffect, useState } from "react"
import {
  listReviewQueueSubmissions,
  type SubmissionReviewResult,
} from "../api/review.api"

export function useReviewQueue() {
  const [queue, setQueue] = useState<SubmissionReviewResult[]>([])
  const [queueLoading, setQueueLoading] = useState(true)
  const [queueError, setQueueError] = useState("")

  const refresh = useCallback(async () => {
    setQueueLoading(true)
    setQueueError("")
    try {
      const response = await listReviewQueueSubmissions()
      if (!response.success || !response.data) {
        setQueue([])
        setQueueError(response.message ?? "Could not load review queue.")
        return
      }
      setQueue(response.data)
    } catch {
      setQueue([])
      setQueueError("Could not reach MangaFlow review queue API.")
    } finally {
      setQueueLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    queue,
    queueLoading,
    queueError,
    refresh,
  }
}
