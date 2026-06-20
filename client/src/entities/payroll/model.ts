import { tasks } from "../task/model";
export type Payroll = {
  id: string;
  taskId: string;
  amount: number;
  status: "pending" | "confirmed" | "paid";
  period: string;
};

export const payroll: Payroll[] = tasks
  .filter((t) => t.status === "approved" || t.status === "submitted")
  .map((t, i) => ({
    id: `pay_${t.id}`,
    taskId: t.id,
    amount: t.payout,
    status: i === 0 ? "paid" : i === 1 ? "confirmed" : "pending",
    period: "2026-06",
  }));
