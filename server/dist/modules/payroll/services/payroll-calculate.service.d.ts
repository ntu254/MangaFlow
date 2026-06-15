import { type PayrollActor } from "../policies/payroll-access.policy.js";
export declare function calculateTaskEarningService(taskId: string, actor: PayrollActor): Promise<import("mongoose").Document<unknown, {}, import("../payroll.model.js").AssistantEarningDocument, {}, {}> & import("../payroll.model.js").AssistantEarningDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=payroll-calculate.service.d.ts.map