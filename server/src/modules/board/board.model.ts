import mongoose, { Schema, type Document } from "mongoose"
import { AT_RISK_DECISIONS, BOARD_DECISION_STATUSES, BOARD_VOTE_VALUES, PUBLICATION_TYPES, type AtRiskDecision, type BoardDecisionStatus, type BoardVoteValue, type PublicationType } from "../../shared/workflow/status.js"

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

export interface BoardReviewSessionDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  status: "OPEN" | "CLOSED"
  openedBy?: mongoose.Types.ObjectId
  closedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const boardReviewSessionSchema = new Schema<BoardReviewSessionDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    status: { type: String, enum: ["OPEN", "CLOSED"], required: true, default: "OPEN", index: true },
    openedBy: { type: Schema.Types.ObjectId, ref: "User" },
    closedAt: { type: Date },
  },
  { timestamps: true },
)
boardReviewSessionSchema.index({ seriesId: 1, status: 1 })

export const BoardReviewSession = mongoose.model<BoardReviewSessionDocument>("BoardReviewSession", boardReviewSessionSchema)

export interface BoardVoteDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  sessionId?: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  value: BoardVoteValue
  note?: string
  createdAt: Date
  updatedAt: Date
}

const boardVoteSchema = new Schema<BoardVoteDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "BoardReviewSession", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    value: { type: String, enum: BOARD_VOTE_VALUES, required: true },
    note: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
)
boardVoteSchema.index({ sessionId: 1, userId: 1 }, { unique: true, partialFilterExpression: { sessionId: { $exists: true } } })
boardVoteSchema.index({ seriesId: 1, userId: 1 })

export const BoardVote = mongoose.model<BoardVoteDocument>("BoardVote", boardVoteSchema)

export interface BoardDecisionDocument extends Document {
  seriesId: mongoose.Types.ObjectId
  status: BoardDecisionStatus
  result?: BoardVoteValue
  publicationType?: PublicationType
  publishAt?: Date
  scheduleNote?: string
  scheduleManagedBy?: mongoose.Types.ObjectId
  note?: string
  decidedBy?: mongoose.Types.ObjectId
  finalizedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const boardDecisionSchema = new Schema<BoardDecisionDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, unique: true, index: true },
    status: { type: String, enum: BOARD_DECISION_STATUSES, required: true, default: "PENDING", index: true },
    result: { type: String, enum: BOARD_VOTE_VALUES },
    publicationType: { type: String, enum: PUBLICATION_TYPES },
    publishAt: { type: Date, index: true },
    scheduleNote: { type: String, trim: true, maxlength: 2000 },
    scheduleManagedBy: { type: Schema.Types.ObjectId, ref: "User" },
    note: { type: String, trim: true, maxlength: 2000 },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    finalizedAt: { type: Date },
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
