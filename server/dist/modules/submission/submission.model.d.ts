import mongoose, { type Document } from "mongoose";
import { type SubmissionStatus } from "../../shared/workflow/status.js";
export interface SubmissionDocument extends Document {
    taskId: mongoose.Types.ObjectId;
    seriesId: mongoose.Types.ObjectId;
    chapterId: mongoose.Types.ObjectId;
    pageId?: mongoose.Types.ObjectId;
    regionId?: mongoose.Types.ObjectId;
    submittedBy: mongoose.Types.ObjectId;
    version: number;
    resultText?: string;
    fileAssetId?: mongoose.Types.ObjectId;
    status: SubmissionStatus;
    reviewerNote?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Submission: mongoose.Model<SubmissionDocument, {}, {}, {}, mongoose.Document<unknown, {}, SubmissionDocument, {}, {}> & SubmissionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=submission.model.d.ts.map