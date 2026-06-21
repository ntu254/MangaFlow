import mongoose from "mongoose"
import { AppError } from "../../shared/errors/AppError.js"
import { notifyRole, notifyUsers, recordAuditLog } from "../../shared/workflow/events.js"
import type { AtRiskDecision, BoardVoteValue, PublicationType } from "../../shared/workflow/status.js"
import {
  closeBoardReviewSession,
  createAtRiskDecision,
  createBoardVote,
  getBoardSeries,
  getDecisionBySeries,
  getOpenBoardReviewSession,
  getOrCreateDecision,
  isBoardChair,
  listBoardQueueSeries,
  listBoardVotes,
  listEligibleBoardUsers,
  updateDecision,
  updateLatestManuscriptAfterDecision,
  updateSeriesAfterDecision,
} from "./board.repository.js"

const RESULT_TO_SERIES = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  NEEDS_REVISION: "REVISION_REQUESTED",
} as const

const RESULT_TO_DECISION = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  NEEDS_REVISION: "NEEDS_REVISION",
} as const

const DECISION_TO_RESULT = {
  APPROVED: "APPROVE",
  REJECTED: "REJECT",
  NEEDS_REVISION: "NEEDS_REVISION",
} as const

function summarize(votes: Array<{ value: BoardVoteValue }>) {
  return votes.reduce<Record<BoardVoteValue, number>>(
    (acc, vote) => {
      acc[vote.value] += 1
      return acc
    },
    { APPROVE: 0, REJECT: 0, NEEDS_REVISION: 0 },
  )
}

function plurality(counts: Record<BoardVoteValue, number>): BoardVoteValue | "TIE_BREAK_REQUIRED" {
  const entries = Object.entries(counts) as Array<[BoardVoteValue, number]>
  const max = Math.max(...entries.map(([, count]) => count))
  const winners = entries.filter(([, count]) => count === max)
  return winners.length === 1 ? winners[0][0] : "TIE_BREAK_REQUIRED"
}

function userIdOfEligible(record: any): string {
  return String(record.userId ?? record._id ?? record.id)
}

function isDuplicateVoteError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === 11000)
}

function isTransactionUnsupportedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes("Transaction numbers are only allowed") || message.includes("replica set member or mongos")
}

async function runBoardWrite<T>(operation: (session?: mongoose.ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession()
  try {
    session.startTransaction()
    const result = await operation(session)
    await session.commitTransaction()
    return result
  } catch (error) {
    try {
      await session.abortTransaction()
    } catch {
      // Keep the original write error; abort failures are secondary cleanup noise.
    }
    if (isTransactionUnsupportedError(error)) {
      return operation(undefined)
    }
    throw error
  } finally {
    session.endSession()
  }
}

async function assertEligibleBoardUser(userId: string) {
  const eligible = await listEligibleBoardUsers()
  if (eligible.length === 0) throw new AppError("No active Board members are configured", 409)
  if (!eligible.some((record) => userIdOfEligible(record) === userId)) {
    throw new AppError("Only active Board members can vote or finalize decisions", 403)
  }
  return eligible
}

async function assertBoardReviewSeries(seriesId: string, session?: mongoose.ClientSession) {
  const series = await getBoardSeries(seriesId, session)
  if (!series) throw new AppError("Series not found", 404)
  if (series.status !== "BOARD_REVIEW") throw new AppError("Board action requires Series in BOARD_REVIEW", 409)
  return series
}

async function getOpenSessionOrThrow(seriesId: string, session?: mongoose.ClientSession) {
  const reviewSession = await getOpenBoardReviewSession(seriesId, session)
  if (!reviewSession) throw new AppError("Board review session is not open", 409)
  return reviewSession
}

export async function listBoardQueueService() {
  const eligible = await listEligibleBoardUsers()
  const eligibleBoardCount = eligible.length
  const quorum = Math.ceil(eligibleBoardCount / 2)
  const seriesList = await listBoardQueueSeries()
  return Promise.all(
    seriesList.map(async (series) => {
      const reviewSession = await getOpenBoardReviewSession(series.id)
      const [votes, decision] = await Promise.all([listBoardVotes(series.id, undefined, reviewSession?.id), getDecisionBySeries(series.id)])
      return {
        id: series.id,
        seriesTitle: series.title,
        ownerId: String(series.ownerId),
        seriesStatus: series.status,
        requestedPublicationType: series.requestedPublicationType,
        publicationType: series.publicationType,
        decisionStatus: decision?.status ?? (series.status === "BOARD_REVIEW" ? "PENDING" : series.status === "APPROVED" ? "APPROVED" : series.status === "REJECTED" ? "REJECTED" : "NEEDS_REVISION"),
        voteSummary: summarize(votes),
        voteCount: votes.length,
        eligibleBoardCount,
        quorum,
        canFinalize: eligibleBoardCount > 0 && series.status === "BOARD_REVIEW" && Boolean(reviewSession) && votes.length >= quorum,
        sessionId: reviewSession?.id ?? null,
        updatedAt: series.updatedAt,
      }
    }),
  )
}

export async function castBoardVoteService(seriesId: string, userId: string, value: BoardVoteValue, note?: string) {
  try {
    const result = await runBoardWrite(async (session) => {
      await assertBoardReviewSeries(seriesId, session)
      await assertEligibleBoardUser(userId)
      const reviewSession = await getOpenSessionOrThrow(seriesId, session)
      await getOrCreateDecision(seriesId, session)
      const vote = await createBoardVote(seriesId, reviewSession.id, userId, value, note?.trim() || undefined, session)
      const votes = await listBoardVotes(seriesId, session, reviewSession.id)
      return { vote, summary: summarize(votes) }
    })
    void recordAuditLog({
      event: "BOARD_MEMBER_VOTED",
      actorId: userId,
      entityType: "Series",
      entityId: seriesId,
      metadata: { value },
    }).catch(() => undefined)
    return result
  } catch (error) {
    if (isDuplicateVoteError(error)) throw new AppError("Board member has already voted in this review session", 409)
    throw error
  }
}

export interface FinalizeBoardDecisionInput {
  decision?: "APPROVED" | "REJECTED" | "NEEDS_REVISION"
  publicationType?: PublicationType
  note?: string
}

async function applyBoardResult(seriesId: string, reviewSessionId: string, result: BoardVoteValue, decidedBy: string, input: FinalizeBoardDecisionInput, session?: mongoose.ClientSession) {
  const publicationType = input.publicationType
  if (result === "APPROVE" && !publicationType) {
    throw new AppError("Publication type is required when approving a series", 400)
  }

  const seriesStatus = RESULT_TO_SERIES[result]
  const updatedSeries = await updateSeriesAfterDecision(seriesId, seriesStatus, session, result === "APPROVE" ? publicationType : undefined)
  await updateLatestManuscriptAfterDecision(seriesId, seriesStatus, session)
  await closeBoardReviewSession(reviewSessionId, session)
  const decision = await updateDecision(seriesId, RESULT_TO_DECISION[result], result, decidedBy, session, result === "APPROVE" ? publicationType : undefined, input.note?.trim() || undefined)
  const event = result === "APPROVE" ? "BOARD_APPROVED_SERIES" : result === "REJECT" ? "BOARD_REJECTED_SERIES" : "BOARD_REQUESTED_REVISION"

  void Promise.all([
    updatedSeries?.ownerId
      ? notifyUsers([String(updatedSeries.ownerId)], {
          event,
          title: result === "APPROVE" ? "Series approved" : result === "REJECT" ? "Series rejected" : "Revision requested by Board",
          message: `${updatedSeries.title ?? "Series"} Board decision: ${RESULT_TO_DECISION[result]}.`,
          link: `/app/mangaka/series/${seriesId}`,
        })
      : Promise.resolve([]),
    notifyRole("EDITOR", {
      event,
      title: "Board decision finalized",
      message: `${updatedSeries?.title ?? "Series"} Board decision: ${RESULT_TO_DECISION[result]}.`,
      link: `/app/editor/series/${seriesId}/review`,
    }),
    recordAuditLog({
      event,
      actorId: decidedBy,
      entityType: "Series",
      entityId: seriesId,
      metadata: { result, publicationType },
    }),
  ]).catch(() => undefined)

  return decision
}

export async function finalizeBoardDecisionService(seriesId: string, userId: string, input: FinalizeBoardDecisionInput = {}) {
  return runBoardWrite(async (session) => {
    await assertBoardReviewSeries(seriesId, session)
    const eligible = await assertEligibleBoardUser(userId)
    const reviewSession = await getOpenSessionOrThrow(seriesId, session)
    const votes = await listBoardVotes(seriesId, session, reviewSession.id)
    const quorum = Math.ceil(eligible.length / 2)
    if (votes.length < quorum) throw new AppError("Not enough Board votes to finalize", 409)

    const result = plurality(summarize(votes))
    if (result === "TIE_BREAK_REQUIRED") {
      const decision = await updateDecision(seriesId, "TIE_BREAK_REQUIRED", undefined, userId, session)
      void recordAuditLog({
        event: "BOARD_TIE_BREAK_REQUIRED",
        actorId: userId,
        entityType: "Series",
        entityId: seriesId,
      }).catch(() => undefined)
      return decision
    }

    if (input.decision && DECISION_TO_RESULT[input.decision] !== result) {
      throw new AppError("Finalize decision does not match the Board vote result", 409)
    }

    const decision = await applyBoardResult(seriesId, reviewSession.id, result, userId, input, session)
    return decision
  })
}

export interface TieBreakBoardDecisionInput {
  value: BoardVoteValue
  publicationType?: PublicationType
  note?: string
}

export async function tieBreakBoardDecisionService(seriesId: string, userId: string, input: TieBreakBoardDecisionInput | BoardVoteValue) {
  const value = typeof input === "string" ? input : input.value
  const publicationType = typeof input === "string" ? undefined : input.publicationType
  const note = typeof input === "string" ? undefined : input.note

  return runBoardWrite(async (session) => {
    await assertBoardReviewSeries(seriesId, session)
    await assertEligibleBoardUser(userId)
    if (!(await isBoardChair(userId))) throw new AppError("Only Board Chair can tie-break", 403)
    const reviewSession = await getOpenSessionOrThrow(seriesId, session)
    const decision = await getOrCreateDecision(seriesId, session)
    if (decision.status !== "TIE_BREAK_REQUIRED") throw new AppError("Tie-break is not required", 409)
    const updated = await applyBoardResult(seriesId, reviewSession.id, value, userId, { publicationType, note }, session)
    void recordAuditLog({
      event: "BOARD_TIE_BREAK_DECIDED",
      actorId: userId,
      entityType: "Series",
      entityId: seriesId,
      metadata: { value },
    }).catch(() => undefined)
    return updated
  })
}

const AT_RISK_TO_SERIES = {
  CONTINUE: "ONGOING",
  WARNING: "AT_RISK",
  REQUEST_IMPROVEMENT_PLAN: "AT_RISK",
  CANCEL: "CANCELLED",
} as const

export async function createAtRiskDecisionService(seriesId: string, userId: string, decision: AtRiskDecision, note?: string) {
  const series = await getBoardSeries(seriesId)
  if (!series) throw new AppError("Series not found", 404)
  if (series.status !== "AT_RISK") {
    throw new AppError("At-risk decision requires Series in AT_RISK status", 409)
  }

  const record = await createAtRiskDecision(seriesId, decision, userId, note?.trim() || undefined)
  await updateSeriesAfterDecision(seriesId, AT_RISK_TO_SERIES[decision])
  return record
}
