import type { PayrollActor } from "../policies/payroll-access.policy.js";
export declare function listPayrollEarningsService(actor: PayrollActor): Promise<(import("mongoose").FlattenMaps<import("../payroll.model.js").AssistantEarningDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
//# sourceMappingURL=payroll-query.service.d.ts.map