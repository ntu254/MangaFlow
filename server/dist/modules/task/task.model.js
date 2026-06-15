import mongoose, { Schema } from "mongoose";
import { TASK_STATUSES, TASK_PRIORITIES } from "../../shared/workflow/status.js";
const taskTypeSchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    baseRate: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
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
}, { timestamps: true });
taskSchema.index({ seriesId: 1, assignedTo: 1, status: 1 });
taskSchema.index({ chapterId: 1, status: 1 });
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