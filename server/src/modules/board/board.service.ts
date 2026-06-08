import { AppError } from "../../shared/errors/AppError.js"
import type { BoardVoteValue } from "../../shared/workflow/status.js"
import { getBoardSeries, getDecisionBySeries, getOrCreateDecision, isBoardChair, listBoardQueueSeries, listBoardVotes, listEligibleBoardUsers, updateDecision, updateSeriesAfterDecision, upsertBoardVote } from "./board.repository.js"

const RESULT_TO_SERIES = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  NEEDS_REVISION: "REVISION_REQUESTED",
} as const

function summarize(votes: Array<{ value: BoardVoteValue }>) {
  return votes.reduce<Record<BoardVoteValue, number>>((acc, vote) => {
    acc[vote.value] += 1
    return acc
  }, { APPROVE: 0, REJECT: 0, NEEDS_REVISION: 0 })
}

function plurality(counts: Record<BoardVoteValue, number>): BoardVoteValue | "TIE_BREAK_REQUIRED" {
  const entries = Object.entries(counts) as Array<[BoardVoteValue, number]>
  const max = Math.max(...entries.map(([, count]) => count))
  const winners = entries.filter(([, count]) => count === max)
  return winners.length === 1 ? winners[0][0] : "TIE_BREAK_REQUIRED"
}


export async function listBoardQueueService() {
  const seriesList = await listBoardQueueSeries()
  return Promise.all(seriesList.map(async (series) => {
    const [votes, decision] = await Promise.all([listBoardVotes(series.id), getDecisionBySeries(series.id)])
    return {
      id: series.id,
      seriesTitle: series.title,
      ownerId: String(series.ownerId),
      seriesStatus: series.status,
      decisionStatus: decision?.status ?? (series.status === "BOARD_REVIEW" ? "PENDING" : series.status === "APPROVED" ? "APPROVED" : series.status === "REJECTED" ? "REJECTED" : "NEEDS_REVISION"),
      voteSummary: summarize(votes),
      updatedAt: series.updatedAt,
    }
  }))
}

async function assertBoardReviewSeries(seriesId: string) {
  const series = await getBoardSeries(seriesId)
  if (!series) throw new AppError("Series not found", 404)
  if (series.status !== "BOARD_REVIEW") throw new AppError("Board vote requires Series in BOARD_REVIEW", 409)
  return series
}

export async function castBoardVoteService(seriesId: string, userId: string, value: BoardVoteValue) {
  await assertBoardReviewSeries(seriesId)
  await getOrCreateDecision(seriesId)
  const vote = await upsertBoardVote(seriesId, userId, value)
  const votes = await listBoardVotes(seriesId)
  return { vote, summary: summarize(votes) }
}

export async function finalizeBoardDecisionService(seriesId: string, userId: string) {
  await assertBoardReviewSeries(seriesId)
  const [eligible, votes] = await Promise.all([listEligibleBoardUsers(), listBoardVotes(seriesId)])
  const minVotes = Math.min(3, eligible.length)
  if (votes.length < minVotes) throw new AppError("Not enough Board votes to finalize", 409)

  const result = plurality(summarize(votes))
  if (result === "TIE_BREAK_REQUIRED") {
    return updateDecision(seriesId, "TIE_BREAK_REQUIRED", undefined, userId)
  }

  await updateSeriesAfterDecision(seriesId, RESULT_TO_SERIES[result])
  return updateDecision(seriesId, result === "APPROVE" ? "APPROVED" : result === "REJECT" ? "REJECTED" : "NEEDS_REVISION", result, userId)
}

export async function tieBreakBoardDecisionService(seriesId: string, userId: string, value: BoardVoteValue) {
  await assertBoardReviewSeries(seriesId)
  if (!(await isBoardChair(userId))) throw new AppError("Only Board Chair can tie-break", 403)
  const decision = await getOrCreateDecision(seriesId)
  if (decision.status !== "TIE_BREAK_REQUIRED") throw new AppError("Tie-break is not required", 409)
  await updateSeriesAfterDecision(seriesId, RESULT_TO_SERIES[value])
  return updateDecision(seriesId, value === "APPROVE" ? "APPROVED" : value === "REJECT" ? "REJECTED" : "NEEDS_REVISION", value, userId)
}
