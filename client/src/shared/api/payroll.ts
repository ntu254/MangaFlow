import { api, unwrap } from "./_client";

export type PayrollCurrency = "VND" | "POINT" | (string & {});

export interface PayrollEarning {
  id?: string;
  _id?: string;
  taskId?:
    | string
    | {
        _id?: string;
        id?: string;
        title?: string;
        taskTypeId?: string | { _id?: string; id?: string; name?: string; code?: string };
      };
  seriesId?: string | { _id?: string; id?: string; title?: string };
  chapterId?: string | { _id?: string; id?: string; title?: string; chapterNumber?: string };
  assistantId?: string | { _id?: string; id?: string; name?: string; email?: string };
  amount: number;
  finalPayment?: number;
  baseRate?: number;
  rateSnapshot?: number;
  deadlineMultiplier?: number;
  isLate?: boolean;
  currency: PayrollCurrency;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PAID"
    | "VOID"
    | "VOIDED"
    | "pending"
    | "confirmed"
    | "paid"
    | "void"
    | "voided";
  period?: string;
  calculatedAt?: string;
  confirmedAt?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

function normalizePayrollEarning(earning: PayrollEarning): PayrollEarning {
  const amount = Number(earning.amount ?? earning.finalPayment ?? 0);
  const baseRate = Number(earning.baseRate ?? earning.rateSnapshot ?? 0);
  return {
    ...earning,
    id: earning.id ?? earning._id,
    amount,
    finalPayment: Number(earning.finalPayment ?? amount),
    baseRate,
    rateSnapshot: Number(earning.rateSnapshot ?? baseRate),
    currency: earning.currency ?? "VND",
    period: earning.period ?? periodFromDate(earning.calculatedAt ?? earning.createdAt),
  };
}

function periodFromDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export const payrollApi = {
  listEarnings: () =>
    api
      .get("/payroll/earnings")
      .then(unwrap<PayrollEarning[]>)
      .then((earnings) => earnings.map(normalizePayrollEarning)),
  confirmTask: (taskId: string) =>
    api
      .post(`/payroll/tasks/${taskId}/confirm`)
      .then(unwrap<PayrollEarning>)
      .then(normalizePayrollEarning),
  markPaid: (earningId: string) =>
    api
      .post(`/payroll/earnings/${earningId}/mark-paid`)
      .then(unwrap<PayrollEarning>)
      .then(normalizePayrollEarning),
};
