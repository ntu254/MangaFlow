import mongoose, { Schema } from "mongoose";
import { ASSISTANT_EARNING_STATUSES, } from "../../shared/workflow/status.js";
const assistantEarningSchema = new Schema({
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, unique: true, index: true },
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true, index: true },
    assistantId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    baseRate: { type: Number, required: true, min: 0 },
    deadlineMultiplier: { type: Number, required: true, min: 0 },
    finalPayment: { type: Number, required: true, min: 0 },
    isLate: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ASSISTANT_EARNING_STATUSES,
        required: true,
        default: "PENDING",
        index: true,
    },
    calculatedAt: { type: Date, required: true },
    confirmedBy: { type: Schema.Types.ObjectId, ref: "User" },
    confirmedAt: { type: Date },
    paidBy: { type: Schema.Types.ObjectId, ref: "User" },
    paidAt: { type: Date },
}, { timestamps: true });
assistantEarningSchema.index({ assistantId: 1, status: 1 });
assistantEarningSchema.index({ seriesId: 1, status: 1 });
assistantEarningSchema.set("toJSON", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const AssistantEarning = mongoose.model("AssistantEarning", assistantEarningSchema);
//# sourceMappingURL=payroll.model.js.map