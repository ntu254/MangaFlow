import mongoose, { type Document } from "mongoose";
import { type AtRiskDecision, type BoardDecisionStatus, type BoardVoteValue, type PublicationType } from "../../shared/workflow/status.js";
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
export interface BoardReviewSessionDocument extends Document {
    seriesId: mongoose.Types.ObjectId;
    status: "OPEN" | "CLOSED";
    openedBy?: mongoose.Types.ObjectId;
    closedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BoardReviewSession: mongoose.Model<BoardReviewSessionDocument, {}, {}, {}, mongoose.Document<unknown, {}, BoardReviewSessionDocument, {}, {}> & BoardReviewSessionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface BoardVoteDocument extends Document {
    seriesId: mongoose.Types.ObjectId;
    sessionId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    value: BoardVoteValue;
    note?: string;
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
    publicationType?: PublicationType;
    note?: string;
    decidedBy?: mongoose.Types.ObjectId;
    finalizedAt?: Date;
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