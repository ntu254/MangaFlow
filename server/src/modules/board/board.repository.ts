import type { ClientSession } from "mongoose"
import { User } from "../auth/auth.model.js"
import { Series } from "../series/series.model.js"
import { AtRiskDecisionRecord, BoardDecision, BoardMember, BoardVote } from "./board.model.js"
import type { AtRiskDecision, BoardDecisionStatus, BoardVoteValue, SeriesStatus } from "../../shared/workflow/status.js"


export async function listBoardQueueSeries(): Promise<any[]> {
  return Series.find({ status: { $in: ["BOARD_REVIEW", "APPROVED", "REJECTED", "REVISION_REQUESTED"] } }).sort({ updatedAt: -1 })
}

export async function getDecisionBySeries(seriesId: string, session?: ClientSession): Promise<any | null> {
  return BoardDecision.findOne({ seriesId }).session(session ?? null)
}

export async function getBoardSeries(seriesId: string, session?: ClientSession): Promise<any | null> {
  return Series.findById(seriesId).session(session ?? null)
}

export async function upsertBoardVote(seriesId: string, userId: string, value: BoardVoteValue, session?: ClientSession): Promise<any> {
  return BoardVote.findOneAndUpdate({ seriesId, userId }, { value }, { new: true, upsert: true, setDefaultsOnInsert: true, session })
}

export async function listBoardVotes(seriesId: string, session?: ClientSession): Promise<any[]> {
  return BoardVote.find({ seriesId }).session(session ?? null)
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

export async function updateDecision(seriesId: string, status: BoardDecisionStatus, result?: BoardVoteValue, decidedBy?: string, session?: ClientSession): Promise<any> {
  return BoardDecision.findOneAndUpdate({ seriesId }, { status, result, decidedBy }, { new: true, upsert: true, setDefaultsOnInsert: true, session })
}

export async function updateSeriesAfterDecision(seriesId: string, status: SeriesStatus, session?: ClientSession): Promise<any> {
  return Series.findByIdAndUpdate(seriesId, { status }, { new: true, session })
}


export async function createAtRiskDecision(seriesId: string, decision: AtRiskDecision, decidedBy: string, note?: string, session?: ClientSession): Promise<any> {
  const [record] = await AtRiskDecisionRecord.create([{ seriesId, decision, decidedBy, note }], { session })
  return record
}
