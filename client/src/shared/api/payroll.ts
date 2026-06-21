import { api, unwrap } from "./_client";

export interface PayrollEarning {
  id?: string;
  _id?: string;
  taskId?: string | { _id?: string; id?: string; title?: string; taskTypeId?: any };
  seriesId?: string | { _id?: string; id?: string; title?: string };
  assistantId?: string | { _id?: string; id?: string; name?: string; email?: string };
  amount: number;
  currency?: string;
  status: "PENDING" | "CONFIRMED" | "PAID" | "VOID" | "pending" | "confirmed" | "paid" | "void";
  period?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const payrollApi = {
  listEarnings: () => api.get("/payroll/earnings").then(unwrap<PayrollEarning[]>),
  confirmTask: (taskId: string) =>
    api.post(`/payroll/tasks/${taskId}/confirm`).then(unwrap<PayrollEarning>),
  markPaid: (earningId: string) =>
    api.post(`/payroll/earnings/${earningId}/mark-paid`).then(unwrap<PayrollEarning>),
};
