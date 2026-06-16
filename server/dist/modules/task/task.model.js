import mongoose, { Schema } from "mongoose";
import { TASK_STATUSES, TASK_PRIORITIES, TASK_CURRENCIES } from "../../shared/workflow/status.js";
const taskTypeSchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500 },
    baseRate: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: TASK_CURRENCIES, required: true, default: "POINT" },
    isActive: { type: Boolean, default: true, index: true },
    allowRegionTask: { type: Boolean, required: true, default: true },
    allowPageTask: { type: Boolean, required: true, default: true },
    requiresFileSubmission: { type: Boolean, required: true, default: true },
    requiresTextSubmission: { type: Boolean, required: true, default: false },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
taskTypeSchema.set("toJSON", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const TaskType = mongoose.model("TaskType", taskTypeSchema);
const taskSchema = new Schema({
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true, index: true },
    pageId: { type: Schema.Types.ObjectId, ref: "Page", index: true },
    regionId: { type: Schema.Types.ObjectId, ref: "Region", index: true },
    taskTypeId: { type: Schema.Types.ObjectId, ref: "TaskType", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    status: {
        type: String,
        enum: TASK_STATUSES,
        required: true,
        default: "TODO",
        index: true,
    },
    priority: {
        type: String,
        enum: TASK_PRIORITIES,
        required: true,
        default: "NORMAL",
    },
    baseRate: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    contextPageIds: [{ type: Schema.Types.ObjectId, ref: "Page" }],
    currentSubmissionId: { type: Schema.Types.ObjectId, ref: "Submission" },
    revisionRequestedByRole: { type: String, enum: ["MANGAKA", "EDITOR"] },
    revisionRequestedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    revisionRequestedAt: { type: Date },
}, { timestamps: true });
taskSchema.index({ seriesId: 1, assignedTo: 1, status: 1 });
taskSchema.index({ chapterId: 1, status: 1 });
/**
 * Flow-05 duplicate-task guard: at most one active task per (chapterId + pageId + taskTypeId)
 * and per (chapterId + regionId + taskTypeId). Enforced at service level; this index aids lookups.
 */
taskSchema.index({ chapterId: 1, pageId: 1, taskTypeId: 1, status: 1 });
taskSchema.index({ chapterId: 1, regionId: 1, taskTypeId: 1, status: 1 });
taskSchema.set("toJSON", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const Task = mongoose.model("Task", taskSchema);
//# sourceMappingURL=task.model.js.map