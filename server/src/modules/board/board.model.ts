import mongoose, { Schema, type Document } from "mongoose"
import { AT_RISK_DECISIONS, BOARD_DECISION_STATUSES, BOARD_VOTE_VALUES, type AtRiskDecision, type BoardDecisionStatus, type BoardVoteValue } from "../../shared/workflow/status.js"

export interface BoardMemberDocument extends Document {
  userId: mongoose.Types.ObjectId
  isActive: boolean
  isChair: boolean
  createdAt: Date
  updatedAt: Date
}

const boardMemberSchema = new Schema<BoardMemberDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    isChair: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
)

export const BoardMember = mongoose.model<BoardMemberDocument>("BoardMember", boardMemberSchema)

export interface BoardVoteDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  value: BoardVoteValue
  createdAt: Date
  updatedAt: Date
}

const boardVoteSchema = new Schema<BoardVoteDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    value: { type: String, enum: BOARD_VOTE_VALUES, required: true },
  },
  { timestamps: true },
)
boardVoteSchema.index({ seriesId: 1, userId: 1 }, { unique: true })

export const BoardVote = mongoose.model<BoardVoteDocument>("BoardVote", boardVoteSchema)

export interface BoardDecisionDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  status: BoardDecisionStatus
  result?: BoardVoteValue
  decidedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const boardDecisionSchema = new Schema<BoardDecisionDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, unique: true, index: true },
    status: { type: String, enum: BOARD_DECISION_STATUSES, required: true, default: "PENDING", index: true },
    result: { type: String, enum: BOARD_VOTE_VALUES },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
)

export const BoardDecision = mongoose.model<BoardDecisionDocument>("BoardDecision", boardDecisionSchema)


export interface AtRiskDecisionDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  decision: AtRiskDecision
  decidedBy: mongoose.Types.ObjectId
  note?: string
  createdAt: Date
  updatedAt: Date
}

const atRiskDecisionSchema = new Schema<AtRiskDecisionDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    decision: { type: String, enum: AT_RISK_DECISIONS, required: true, index: true },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
)

atRiskDecisionSchema.index({ seriesId: 1, createdAt: -1 })

export const AtRiskDecisionRecord = mongoose.model<AtRiskDecisionDocument>("AtRiskDecision", atRiskDecisionSchema)
