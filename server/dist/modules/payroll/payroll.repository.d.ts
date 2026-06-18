import type { AssistantEarningStatus } from "../../shared/workflow/status.js";
export interface CreateEarningInput {
    taskId: string;
    seriesId: string;
    chapterId: string;
    assistantId: string;
    baseRate: number;
    deadlineMultiplier: number;
    finalPayment: number;
    isLate: boolean;
    calculatedAt: Date;
}
export declare function getTaskForPayroll(taskId: string): Promise<(import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskDocument, {}, {}> & import("../task/task.model.js").TaskDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function getEarningByTaskId(taskId: string): Promise<(import("mongoose").Document<unknown, {}, import("./payroll.model.js").AssistantEarningDocument, {}, {}> & import("./payroll.model.js").AssistantEarningDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function createEarningRecord(input: CreateEarningInput): Promise<import("mongoose").Document<unknown, {}, import("./payroll.model.js").AssistantEarningDocument, {}, {}> & import("./payroll.model.js").AssistantEarningDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function getEarningById(earningId: string): Promise<(import("mongoose").Document<unknown, {}, import("./payroll.model.js").AssistantEarningDocument, {}, {}> & import("./payroll.model.js").AssistantEarningDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function updateEarningStatus(earningId: string, status: AssistantEarningStatus, actorField: "confirmedBy" | "paidBy", actorId: string): Promise<(import("mongoose").FlattenMaps<import("./payroll.model.js").AssistantEarningDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function listEarnings(query: Record<string, unknown>): Promise<(import("mongoose").FlattenMaps<import("./payroll.model.js").AssistantEarningDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
//# sourceMappingURL=payroll.repository.d.ts.map