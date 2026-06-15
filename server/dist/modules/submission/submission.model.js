import mongoose, { Schema } from "mongoose";
import { SUBMISSION_STATUSES, } from "../../shared/workflow/status.js";
const submissionSchema = new Schema({
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true, index: true },
    pageId: { type: Schema.Types.ObjectId, ref: "Page", index: true },
    regionId: { type: Schema.Types.ObjectId, ref: "Region", index: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    version: { type: Number, required: true, min: 1 },
    resultText: { type: String, trim: true, maxlength: 5000 },
    fileAssetId: { type: Schema.Types.ObjectId, ref: "FileAsset" },
    status: {
        type: String,
        enum: SUBMISSION_STATUSES,
        required: true,
        default: "SUBMITTED",
        index: true,
    },
    reviewerNote: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });
submissionSchema.index({ taskId: 1, version: 1 }, { unique: true });
submissionSchema.index({ taskId: 1, status: 1 });
submissionSchema.set("toJSON", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const Submission = mongoose.model("Submission", submissionSchema);
//# sourceMappingURL=submission.model.js.map