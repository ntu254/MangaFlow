import mongoose, { Schema, Document } from "mongoose";

export const boardMemberRoles = ["BOARD_MEMBER", "BOARD_CHAIR"] as const;
export type BoardMemberRole = typeof boardMemberRoles[number];

export const boardMemberStatus = ["ACTIVE", "INACTIVE"] as const;
export type BoardMemberStatus = typeof boardMemberStatus[number];

export interface BoardMemberDocument extends Document {
  userId: mongoose.Types.ObjectId;
  role: BoardMemberRole;
  status: BoardMemberStatus;
  createdAt: Date;
  updatedAt: Date;
}

const boardMemberSchema = new Schema<BoardMemberDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    role: { type: String, enum: boardMemberRoles, required: true },
    status: { type: String, enum: boardMemberStatus, required: true, default: "ACTIVE" }
  },
  { timestamps: true }
);

export const BoardMemberModel = mongoose.model<BoardMemberDocument>("BoardMember", boardMemberSchema);

export const boardVotes = ["APPROVE", "REJECT", "NEEDS_REVISION"] as const;
export type BoardVoteType = typeof boardVotes[number];

export interface BoardVoteDocument extends Document {
  seriesId: mongoose.Types.ObjectId;
  boardMemberId: mongoose.Types.ObjectId;
  vote: BoardVoteType;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const boardVoteSchema = new Schema<BoardVoteDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    boardMemberId: { type: Schema.Types.ObjectId, ref: "BoardMember", required: true },
    vote: { type: String, enum: boardVotes, required: true },
    reason: { type: String, trim: true }
  },
  { timestamps: true }
);

// Compound unique index so each member votes only once per series
boardVoteSchema.index({ seriesId: 1, boardMemberId: 1 }, { unique: true });

export const BoardVoteModel = mongoose.model<BoardVoteDocument>("BoardVote", boardVoteSchema);

export const boardDecisions = ["APPROVED", "REJECTED", "NEEDS_REVISION", "CONTINUE", "CANCEL"] as const;
export type BoardDecisionType = typeof boardDecisions[number];

export interface BoardDecisionDocument extends Document {
  seriesId: mongoose.Types.ObjectId;
  decision: BoardDecisionType;
  voteSummary: {
    approve: number;
    reject: number;
    needsRevision: number;
  };
  decidedBy: mongoose.Types.ObjectId; // Reference to User model
  isTieBreak: boolean;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const boardDecisionSchema = new Schema<BoardDecisionDocument>(
  {
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    decision: { type: String, enum: boardDecisions, required: true },
    voteSummary: {
      approve: { type: Number, required: true, default: 0 },
      reject: { type: Number, required: true, default: 0 },
      needsRevision: { type: Number, required: true, default: 0 }
    },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isTieBreak: { type: Boolean, required: true, default: false },
    reason: { type: String, trim: true }
  },
  { timestamps: true }
);

export const BoardDecisionModel = mongoose.model<BoardDecisionDocument>("BoardDecision", boardDecisionSchema);
