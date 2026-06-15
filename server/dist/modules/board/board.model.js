import mongoose, { Schema } from "mongoose";
import { AT_RISK_DECISIONS, BOARD_DECISION_STATUSES, BOARD_VOTE_VALUES } from "../../shared/workflow/status.js";
const boardMemberSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    isChair: { type: Boolean, default: false, index: true },
}, { timestamps: true });
export const BoardMember = mongoose.model("BoardMember", boardMemberSchema);
const boardVoteSchema = new Schema({
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    value: { type: String, enum: BOARD_VOTE_VALUES, required: true },
}, { timestamps: true });
boardVoteSchema.index({ seriesId: 1, userId: 1 }, { unique: true });
export const BoardVote = mongoose.model("BoardVote", boardVoteSchema);
const boardDecisionSchema = new Schema({
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, unique: true, index: true },
    status: { type: String, enum: BOARD_DECISION_STATUSES, required: true, default: "PENDING", index: true },
    result: { type: String, enum: BOARD_VOTE_VALUES },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
export const BoardDecision = mongoose.model("BoardDecision", boardDecisionSchema);
const atRiskDecisionSchema = new Schema({
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    decision: { type: String, enum: AT_RISK_DECISIONS, required: true, index: true },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });
atRiskDecisionSchema.index({ seriesId: 1, createdAt: -1 });
export const AtRiskDecisionRecord = mongoose.model("AtRiskDecision", atRiskDecisionSchema);
//# sourceMappingURL=board.model.js.map