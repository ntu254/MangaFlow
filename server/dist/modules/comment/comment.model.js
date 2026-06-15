import mongoose, { Schema } from "mongoose";
import { COMMENT_STATUSES, } from "../../shared/workflow/status.js";
const commentSchema = new Schema({
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", index: true },
    pageId: { type: Schema.Types.ObjectId, ref: "Page", index: true },
    regionId: { type: Schema.Types.ObjectId, ref: "Region", index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", index: true },
    submissionId: { type: Schema.Types.ObjectId, ref: "Submission", index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
        type: String,
        enum: COMMENT_STATUSES,
        required: true,
        default: "OPEN",
        index: true,
    },
    isBlocking: { type: Boolean, default: true, index: true },
    fixedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reopenedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
commentSchema.index({ seriesId: 1, status: 1, isBlocking: 1 });
commentSchema.index({ taskId: 1, status: 1 });
commentSchema.set("toJSON", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const Comment = mongoose.model("Comment", commentSchema);
//# sourceMappingURL=comment.model.js.map