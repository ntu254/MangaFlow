import { useCallback, useEffect, useState } from "react"
import { listMangakaRankings, type RankingRecord } from "../api/ranking.api"

export function useMangakaRanking() {
  const [rankings, setRankings] = useState<RankingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await listMangakaRankings()
    if (!res.success) {
      setError(res.message ?? "Could not load rankings")
      setRankings([])
    } else {
      setRankings(res.data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  return { rankings, loading, error, retry: () => void load() }
}