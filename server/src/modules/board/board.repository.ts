import { User } from "../auth/auth.model.js"
import { Series } from "../series/series.model.js"
import { BoardDecision, BoardMember, BoardVote } from "./board.model.js"
import type { BoardDecisionStatus, BoardVoteValue, SeriesStatus } from "../../shared/workflow/status.js"

export async function getBoardSeries(seriesId: string): Promise<any | null> {
  return Series.findById(seriesId)
}

export async function upsertBoardVote(seriesId: string, userId: string, value: BoardVoteValue): Promise<any> {
  return BoardVote.findOneAndUpdate({ seriesId, userId }, { value }, { new: true, upsert: true, setDefaultsOnInsert: true })
}

export async function listBoardVotes(seriesId: string): Promise<any[]> {
  return BoardVote.find({ seriesId })
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

export async function getOrCreateDecision(seriesId: string): Promise<any> {
  return BoardDecision.findOneAndUpdate({ seriesId }, { $setOnInsert: { status: "PENDING" } }, { new: true, upsert: true, setDefaultsOnInsert: true })
}

export async function updateDecision(seriesId: string, status: BoardDecisionStatus, result?: BoardVoteValue, decidedBy?: string): Promise<any> {
  return BoardDecision.findOneAndUpdate({ seriesId }, { status, result, decidedBy }, { new: true, upsert: true, setDefaultsOnInsert: true })
}

export async function updateSeriesAfterDecision(seriesId: string, status: SeriesStatus): Promise<any> {
  return Series.findByIdAndUpdate(seriesId, { status }, { new: true })
}
