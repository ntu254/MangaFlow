import mongoose, { type Document } from "mongoose";
import { type AssistantEarningStatus } from "../../shared/workflow/status.js";
export interface AssistantEarningDocument extends Document {
    taskId: mongoose.Types.ObjectId;
    seriesId: mongoose.Types.ObjectId;
    chapterId: mongoose.Types.ObjectId;
    assistantId: mongoose.Types.ObjectId;
    baseRate: number;
    deadlineMultiplier: number;
    finalPayment: number;
    isLate: boolean;
    status: AssistantEarningStatus;
    calculatedAt: Date;
    confirmedBy?: mongoose.Types.ObjectId;
    confirmedAt?: Date;
    paidBy?: mongoose.Types.ObjectId;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const AssistantEarning: mongoose.Model<AssistantEarningDocument, {}, {}, {}, mongoose.Document<unknown, {}, AssistantEarningDocument, {}, {}> & AssistantEarningDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=payroll.model.d.ts.map