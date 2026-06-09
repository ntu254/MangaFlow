import { useCallback, useEffect, useMemo, useState } from "react"
import { finalizeRanking, importRanking, listRankings, type RankingRecord } from "@/features/ranking/api/ranking.api"
import {
  castBoardVote,
  createAtRiskDecision,
  finalizeBoardDecision,
  listBoardQueue,
  tieBreakBoardDecision,
  type AtRiskDecisionValue,
  type BoardQueueItem,
  type BoardVoteValue,
} from "../api/board.api"
import { buildVoteSummary, toBoardActions, toBoardQueueRows, toRankingRows, toVoteOptions } from "../utils/board-page.mappers"

export function useBoardPage() {
  const [queueItems, setQueueItems] = useState<BoardQueueItem[]>([])
  const [voteSummary, setVoteSummary] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null)
  const [votePreview, setVotePreview] = useState("No API vote action run yet.")
  const [atRiskPreview, setAtRiskPreview] = useState("No at-risk API action run yet.")
  const [rankingRecords, setRankingRecords] = useState<RankingRecord[]>([])
  const [rankingLoading, setRankingLoading] = useState(true)
  const [rankingMessage, setRankingMessage] = useState("No ranking API action run yet.")
  const [rankingForm, setRankingForm] = useState({ period: "", seriesId: "", voteCount: "", readerScore: "" })

  const loadBoardQueue = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await listBoardQueue()
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not load Board queue.")
        setQueueItems([])
        return
      }
      setQueueItems(response.data)
    } catch {
      setError("Could not reach MangaFlow. Check API server and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRankings = useCallback(async () => {
    setRankingLoading(true)
    const response = await listRankings()
    if (!response.success || !response.data) {
      setRankingMessage(response.message ?? "Could not load rankings.")
      setRankingRecords([])
    } else {
      setRankingRecords(response.data)
    }
    setRankingLoading(false)
  }, [])

  useEffect(() => { void loadBoardQueue(); void loadRankings() }, [loadBoardQueue, loadRankings])

  const boardQueueRows = useMemo(() => toBoardQueueRows(queueItems, voteSummary), [queueItems, voteSummary])
  const firstBoardSeries = queueItems.find((item) => item.seriesStatus === "BOARD_REVIEW") ?? queueItems[0] ?? null
  const firstAtRiskSeries = queueItems.find((item) => item.seriesStatus === "AT_RISK") ?? null
  const rankingRows = useMemo(() => toRankingRows(rankingRecords), [rankingRecords])
  const boardActions = useMemo(() => toBoardActions(firstBoardSeries, firstAtRiskSeries), [firstBoardSeries, firstAtRiskSeries])

  const runVote = useCallback(async (value: BoardVoteValue) => {
    if (!firstBoardSeries) return
    setActiveSeriesId(firstBoardSeries.id)
    const response = await castBoardVote(firstBoardSeries.id, value)
    setActiveSeriesId(null)
    if (!response.success || !response.data) {
      setVotePreview(response.message ?? "Vote failed.")
      return
    }
    const summary = response.data.summary
    setVoteSummary((current) => ({ ...current, [firstBoardSeries.id]: buildVoteSummary(summary) }))
    setVotePreview(`${value} vote sent to backend for ${firstBoardSeries.seriesTitle}.`)
  }, [firstBoardSeries])

  const finalizeVote = useCallback(async () => {
    if (!firstBoardSeries) return
    setActiveSeriesId(firstBoardSeries.id)
    const response = await finalizeBoardDecision(firstBoardSeries.id)
    setActiveSeriesId(null)
    setVotePreview(response.success ? `Finalize sent for ${firstBoardSeries.seriesTitle}.` : response.message ?? "Finalize failed.")
    await loadBoardQueue()
  }, [firstBoardSeries, loadBoardQueue])

  const tieBreak = useCallback(async (value: BoardVoteValue) => {
    if (!firstBoardSeries) return
    setActiveSeriesId(firstBoardSeries.id)
    const response = await tieBreakBoardDecision(firstBoardSeries.id, value)
    setActiveSeriesId(null)
    setVotePreview(response.success ? `Tie-break ${value} sent for ${firstBoardSeries.seriesTitle}.` : response.message ?? "Tie-break failed.")
    await loadBoardQueue()
  }, [firstBoardSeries, loadBoardQueue])

  const submitRankingImport = useCallback(async () => {
    const response = await importRanking({
      period: rankingForm.period,
      seriesId: rankingForm.seriesId,
      voteCount: Number(rankingForm.voteCount),
      readerScore: Number(rankingForm.readerScore),
    })
    setRankingMessage(response.success ? "Ranking imported with backend formula." : response.message ?? "Ranking import failed.")
    await loadRankings()
  }, [loadRankings, rankingForm])

  const finalizeTopRanking = useCallback(async () => {
    const target = rankingRecords.find((record) => record.status === "IMPORTED") ?? rankingRecords[0]
    if (!target) {
      setRankingMessage("No ranking row available to finalize.")
      return
    }
    const response = await finalizeRanking(target.id)
    setRankingMessage(response.success ? "Ranking finalized by backend." : response.message ?? "Ranking finalize failed.")
    await loadRankings()
  }, [loadRankings, rankingRecords])

  const submitAtRiskDecision = useCallback(async (decision: AtRiskDecisionValue, note: string) => {
    if (!firstAtRiskSeries) {
      setAtRiskPreview("No AT_RISK series is available for manual Board action.")
      return
    }
    setActiveSeriesId(firstAtRiskSeries.id)
    const response = await createAtRiskDecision(firstAtRiskSeries.id, decision, note)
    setActiveSeriesId(null)
    setAtRiskPreview(response.success ? `${decision} recorded for ${firstAtRiskSeries.seriesTitle}.` : response.message ?? "At-risk decision failed.")
    await loadBoardQueue()
  }, [firstAtRiskSeries, loadBoardQueue])

  const voteOptions = useMemo(() => toVoteOptions(runVote), [runVote])

  return {
    queueItems,
    loading,
    error,
    activeSeriesId,
    votePreview,
    atRiskPreview,
    rankingLoading,
    rankingMessage,
    rankingForm,
    boardQueueRows,
    firstBoardSeries,
    firstAtRiskSeries,
    rankingRows,
    boardActions,
    voteOptions,
    setRankingForm,
    loadBoardQueue,
    runVote,
    finalizeVote,
    tieBreak,
    submitRankingImport,
    finalizeTopRanking,
    submitAtRiskDecision,
  }
}
