export interface DeadlineMultiplierResult {
    multiplier: number;
    isLate: boolean;
}
export declare function calculateDeadlineMultiplier(taskStatus: string, dueDate: Date, completedAt: Date): DeadlineMultiplierResult;
export declare function roundMoney(value: number): number;
//# sourceMappingURL=payroll-calculation.d.ts.map