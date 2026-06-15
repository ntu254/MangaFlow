import mongoose, { type Document } from "mongoose";
import { type TaskStatus, type TaskPriority } from "../../shared/workflow/status.js";
export interface TaskTypeDocument extends Document {
    name: string;
    description: string;
    baseRate: number;
    isActive: boolean;
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
    createdAt: Date;
    updatedAt: Date;
}
export declare const Task: mongoose.Model<TaskDocument, {}, {}, {}, mongoose.Document<unknown, {}, TaskDocument, {}, {}> & TaskDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=task.model.d.ts.map