import { type PayrollActor } from "../policies/payroll-access.policy.js";
export declare function confirmTaskEarningService(taskId: string, actor: PayrollActor): Promise<(import("mongoose").FlattenMaps<import("../payroll.model.js").AssistantEarningDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function markEarningPaidService(earningId: string, actor: PayrollActor): Promise<(import("mongoose").FlattenMaps<import("../payroll.model.js").AssistantEarningDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
//# sourceMappingURL=payroll-command.service.d.ts.map