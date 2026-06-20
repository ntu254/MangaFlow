import { useEffect, useMemo, useState } from "react"
import { atRiskTitles, boardDecisionHistory, boardHome, boardRankings, boardSeries } from "@/data/board"
import type { AtRiskDecision, BoardVoteValue } from "@/domain/workflow"
import { mobileWorkflowDataSource, type BoardHomePayload, type MobileWorkflowDataSource } from "@/services/mobile-workflow-data-source"

export function useBoardMobileFlow(dataSource: MobileWorkflowDataSource = mobileWorkflowDataSource) {
  const [home, setHome] = useState<BoardHomePayload>(boardHome)
  const [seriesReviews, setSeriesReviews] = useState(boardSeries)
  const [tieBreaks, setTieBreaks] = useState(boardSeries.filter((item) => item.decisionStatus === "TIE_BREAK_REQUIRED"))
  const [rankings, setRankings] = useState(boardRankings)
  const [atRiskCases, setAtRiskCases] = useState(atRiskTitles)
  const [decisionHistory, setDecisionHistory] = useState(boardDecisionHistory)
  const [selectedSeriesId, setSelectedSeriesId] = useState(boardSeries[0]?.id ?? "")
  const [selectedAtRiskId, setSelectedAtRiskId] = useState(atRiskTitles[0]?.id ?? "")
  const [selectedRankingId, setSelectedRankingId] = useState(boardRankings[0]?.id ?? "")
  const [pendingVote, setPendingVote] = useState<BoardVoteValue | null>(null)
  const [pendingAtRiskDecision, setPendingAtRiskDecision] = useState<AtRiskDecision | null>(null)
  const [lastMockAction, setLastMockAction] = useState("Mock actions are local only. Board decisions stay auditable backend workflow actions.")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [nextHome, nextSeries, nextTieBreaks, nextRankings, nextAtRisk, nextHistory] = await Promise.all([
          dataSource.getBoardHome(),
          dataSource.getBoardSeriesReviews(),
          dataSource.getBoardTieBreaks(),
          dataSource.getBoardRankings(),
          dataSource.getBoardAtRiskCases(),
          dataSource.getBoardDecisionHistory(),
        ])

        if (!cancelled) {
          setHome(nextHome)
          setSeriesReviews(nextSeries)
          setTieBreaks(nextTieBreaks)
          setRankings(nextRankings)
          setAtRiskCases(nextAtRisk)
          setDecisionHistory(nextHistory)
        }
      } catch {
        if (!cancelled) setError("Could not load board mobile mock flow.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [dataSource])

  const selectedSeries = useMemo(
    () => seriesReviews.find((item) => item.id === selectedSeriesId) ?? seriesReviews[0],
    [seriesReviews, selectedSeriesId],
  )

  const selectedAtRiskCase = useMemo(
    () => atRiskCases.find((item) => item.id === selectedAtRiskId) ?? atRiskCases[0],
    [atRiskCases, selectedAtRiskId],
  )

  const selectedRanking = useMemo(
    () => rankings.find((item) => item.id === selectedRankingId) ?? rankings[0],
    [rankings, selectedRankingId],
  )

  function startVote(value: BoardVoteValue) {
    setPendingVote(value)
  }

  function confirmVote() {
    if (!pendingVote) return
    recordVote(pendingVote)
    setPendingVote(null)
  }

  function cancelVote() {
    setPendingVote(null)
  }

  function recordVote(value: BoardVoteValue) {
    setLastMockAction(`Mock ${value} vote selected. Later API wiring uses POST /api/board/series/:seriesId/votes.`)
  }

  function startAtRiskDecision(decision: AtRiskDecision) {
    setPendingAtRiskDecision(decision)
  }

  function confirmAtRiskDecision() {
    if (!pendingAtRiskDecision) return
    recordAtRiskDecision(pendingAtRiskDecision)
    setPendingAtRiskDecision(null)
  }

  function cancelAtRiskDecision() {
    setPendingAtRiskDecision(null)
  }

  function recordAtRiskDecision(decision: AtRiskDecision) {
    setLastMockAction(`Mock ${decision} at-risk decision requires confirmation. Later API wiring uses the Board at-risk decision endpoint.`)
  }

  return {
    home,
    seriesReviews,
    tieBreaks,
    rankings,
    atRiskCases,
    decisionHistory,
    selectedSeries,
    selectedAtRiskCase,
    selectedRanking,
    selectedSeriesId,
    selectedAtRiskId,
    selectedRankingId,
    pendingVote,
    pendingAtRiskDecision,
    setSelectedSeriesId,
    setSelectedAtRiskId,
    setSelectedRankingId,
    lastMockAction,
    startVote,
    confirmVote,
    cancelVote,
    recordVote,
    startAtRiskDecision,
    confirmAtRiskDecision,
    cancelAtRiskDecision,
    recordAtRiskDecision,
    loading,
    error,
  }
}
