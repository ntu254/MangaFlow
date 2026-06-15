import type { UserRole } from "../../auth/auth.types.js";
export interface PayrollActor {
    userId: string;
    role: UserRole;
}
export declare function assertSeriesMangakaOrAdmin(seriesId: string, actor: PayrollActor): Promise<void>;
export declare function assertEarningMangakaOrAdmin(earning: any, actor: PayrollActor): Promise<void>;
//# sourceMappingURL=payroll-access.policy.d.ts.map