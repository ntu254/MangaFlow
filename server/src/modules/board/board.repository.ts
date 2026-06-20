import type { ClientSession } from "mongoose"
import { User } from "../auth/auth.model.js"
import { Manuscript, Series } from "../series/series.model.js"
import { AtRiskDecisionRecord, BoardDecision, BoardMember, BoardReviewSession, BoardVote } from "./board.model.js"
import type { AtRiskDecision, BoardDecisionStatus, BoardVoteValue, PublicationType, SeriesStatus } from "../../shared/workflow/status.js"

export async function listBoardQueueSeries(): Promise<any[]> {
  return Series.find({ status: { $in: ["BOARD_REVIEW", "APPROVED", "REJECTED", "REVISION_REQUESTED"] } }).sort({ updatedAt: -1 })
}

export async function getDecisionBySeries(seriesId: string, session?: ClientSession): Promise<any | null> {
  return BoardDecision.findOne({ seriesId }).session(session ?? null)
}

export async function getBoardSeries(seriesId: string, session?: ClientSession): Promise<any | null> {
  return Series.findById(seriesId).session(session ?? null)
}

export async function getOpenBoardReviewSession(seriesId: string, session?: ClientSession): Promise<any | null> {
  return BoardReviewSession.findOne({ seriesId, status: "OPEN" }).sort({ createdAt: -1 }).session(session ?? null)
}

export async function createBoardReviewSession(seriesId: string, openedBy?: string, session?: ClientSession): Promise<any> {
  const existing = await getOpenBoardReviewSession(seriesId, session)
  if (existing) return existing
  const [reviewSession] = await BoardReviewSession.create([{ seriesId, openedBy, status: "OPEN" }], { session })
  return reviewSession
}

export async function closeBoardReviewSession(sessionId: string, session?: ClientSession): Promise<any> {
  return BoardReviewSession.findByIdAndUpdate(sessionId, { status: "CLOSED", closedAt: new Date() }, { new: true, session })
}

export async function createBoardVote(seriesId: string, sessionId: string, userId: string, value: BoardVoteValue, note?: string, session?: ClientSession): Promise<any> {
  const [vote] = await BoardVote.create([{ seriesId, sessionId, userId, value, note }], { session })
  return vote
}

export async function listBoardVotes(seriesId: string, session?: ClientSession, sessionId?: string): Promise<any[]> {
  return BoardVote.find(sessionId ? { seriesId, sessionId } : { seriesId }).session(session ?? null)
}

export async function listEligibleBoardUsers(): Promise<any[]> {
  const members = await BoardMember.find({ isActive: true })
  if (members.length > 0) return members
  return User.find({ role: "BOARD", isActive: true })
}

export async function isBoardChair(userId: string): Promise<boolean> {
  const member = await BoardMember.findOne({ userId, isActive: true, isChair: true })
  return Boolean(member)
}

export async function getOrCreateDecision(seriesId: string, session?: ClientSession): Promise<any> {
  return BoardDecision.findOneAndUpdate({ seriesId }, { $setOnInsert: { status: "PENDING" } }, { new: true, upsert: true, setDefaultsOnInsert: true, session })
}

export async function updateDecision(
  seriesId: string,
  status: BoardDecisionStatus,
  result?: BoardVoteValue,
  decidedBy?: string,
  session?: ClientSession,
  publicationType?: PublicationType,
  note?: string,
): Promise<any> {
  const patch: Record<string, unknown> = { status, result, decidedBy, publicationType, note }
  if (!["PENDING", "TIE_BREAK_REQUIRED"].includes(status)) patch.finalizedAt = new Date()

  return BoardDecision.findOneAndUpdate(
    { seriesId },
    patch,
    { new: true, upsert: true, setDefaultsOnInsert: true, session },
  )
}

export async function updateSeriesAfterDecision(seriesId: string, status: SeriesStatus, session?: ClientSession, publicationType?: PublicationType): Promise<any> {
  const patch: Record<string, unknown> = { status }
  if (publicationType) patch.publicationType = publicationType
  return Series.findByIdAndUpdate(seriesId, patch, { new: true, session })
}

export async function updateLatestManuscriptAfterDecision(seriesId: string, status: "APPROVED" | "REVISION_REQUESTED" | "REJECTED", session?: ClientSession): Promise<any> {
  const manuscript = await Manuscript.findOne({ seriesId }).sort({ version: -1 }).session(session ?? null)
  if (!manuscript) return null
  manuscript.status = status
  await manuscript.save({ session })
  return manuscript
}

export async function createAtRiskDecision(seriesId: string, decision: AtRiskDecision, decidedBy: string, note?: string, session?: ClientSession): Promise<any> {
  const [record] = await AtRiskDecisionRecord.create([{ seriesId, decision, decidedBy, note }], { session })
  return record
}
