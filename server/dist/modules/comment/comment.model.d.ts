import mongoose, { type Document } from "mongoose";
import { type CommentStatus } from "../../shared/workflow/status.js";
export interface CommentDocument extends Document {
    seriesId: mongoose.Types.ObjectId;
    chapterId?: mongoose.Types.ObjectId;
    pageId?: mongoose.Types.ObjectId;
    regionId?: mongoose.Types.ObjectId;
    taskId?: mongoose.Types.ObjectId;
    submissionId?: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    body: string;
    status: CommentStatus;
    isBlocking: boolean;
    fixedBy?: mongoose.Types.ObjectId;
    verifiedBy?: mongoose.Types.ObjectId;
    resolvedBy?: mongoose.Types.ObjectId;
    reopenedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Comment: mongoose.Model<CommentDocument, {}, {}, {}, mongoose.Document<unknown, {}, CommentDocument, {}, {}> & CommentDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=comment.model.d.ts.map