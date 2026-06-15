import mongoose, { type Document } from "mongoose";
import { type AtRiskDecision, type BoardDecisionStatus, type BoardVoteValue } from "../../shared/workflow/status.js";
export interface BoardMemberDocument extends Document {
    userId: mongoose.Types.ObjectId;
    isActive: boolean;
    isChair: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BoardMember: mongoose.Model<BoardMemberDocument, {}, {}, {}, mongoose.Document<unknown, {}, BoardMemberDocument, {}, {}> & BoardMemberDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface BoardVoteDocument extends Document {
    seriesId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    value: BoardVoteValue;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BoardVote: mongoose.Model<BoardVoteDocument, {}, {}, {}, mongoose.Document<unknown, {}, BoardVoteDocument, {}, {}> & BoardVoteDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface BoardDecisionDocument extends Document {
    seriesId: mongoose.Types.ObjectId;
    status: BoardDecisionStatus;
    result?: BoardVoteValue;
    decidedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BoardDecision: mongoose.Model<BoardDecisionDocument, {}, {}, {}, mongoose.Document<unknown, {}, BoardDecisionDocument, {}, {}> & BoardDecisionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface AtRiskDecisionDocument extends Document {
    seriesId: mongoose.Types.ObjectId;
    decision: AtRiskDecision;
    decidedBy: mongoose.Types.ObjectId;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const AtRiskDecisionRecord: mongoose.Model<AtRiskDecisionDocument, {}, {}, {}, mongoose.Document<unknown, {}, AtRiskDecisionDocument, {}, {}> & AtRiskDecisionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=board.model.d.ts.map