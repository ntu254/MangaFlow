import mongoose, { type Document } from "mongoose";
import { type TaskStatus, type TaskPriority, type TaskCurrency } from "../../shared/workflow/status.js";
export interface TaskTypeDocument extends Document {
    name: string;
    code: string;
    description?: string;
    baseRate: number;
    currency: TaskCurrency;
    isActive: boolean;
    allowRegionTask: boolean;
    allowPageTask: boolean;
    requiresFileSubmission: boolean;
    requiresTextSubmission: boolean;
    sortOrder?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const TaskType: mongoose.Model<TaskTypeDocument, {}, {}, {}, mongoose.Document<unknown, {}, TaskTypeDocument, {}, {}> & TaskTypeDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface TaskDocument extends Document {
    seriesId: mongoose.Types.ObjectId;
    chapterId: mongoose.Types.ObjectId;
    pageId?: mongoose.Types.ObjectId;
    regionId?: mongoose.Types.ObjectId;
    taskTypeId: mongoose.Types.ObjectId;
    assignedTo: mongoose.Types.ObjectId;
    assignedBy: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    baseRate: number;
    dueDate: Date;
    contextPageIds: mongoose.Types.ObjectId[];
    /** Flow-07: points to the latest Submission so approve/revision can resolve the current version fast. */
    currentSubmissionId?: mongoose.Types.ObjectId;
    /** Flow-06/07: which role last requested revision — MANGAKA or EDITOR. */
    revisionRequestedByRole?: "MANGAKA" | "EDITOR";
    revisionRequestedByUserId?: mongoose.Types.ObjectId;
    revisionRequestedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Task: mongoose.Model<TaskDocument, {}, {}, {}, mongoose.Document<unknown, {}, TaskDocument, {}, {}> & TaskDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=task.model.d.ts.map