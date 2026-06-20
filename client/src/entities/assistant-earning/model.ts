export type AssistantEarningStatus = "calculated" | "confirmed" | "paid" | "voided";

export type AssistantEarning = {
  id: string;
  taskId: string;
  assistantId: string;
  amount: number;
  rateSnapshot: number; // per-task rate snapshot at approval time
  status: AssistantEarningStatus;
  approvedAt: string;
  confirmedAt?: string;
  paidAt?: string;
  period: string; // YYYY-MM
  note?: string;
};

// Seeded so the Assistant Earnings screen has all four lifecycle states.
export const assistantEarnings: AssistantEarning[] = [
  {
    id: "ae_t10",
    taskId: "t10",
    assistantId: "s_as_jubei",
    amount: 14000,
    rateSnapshot: 4500,
    status: "paid",
    approvedAt: "Jun 09",
    confirmedAt: "Jun 10",
    paidAt: "Jun 14",
    period: "2026-06",
  },
  {
    id: "ae_t11",
    taskId: "t11",
    assistantId: "s_as_jubei",
    amount: 8000,
    rateSnapshot: 4500,
    status: "confirmed",
    approvedAt: "Jun 01",
    confirmedAt: "Jun 03",
    period: "2026-06",
  },
  {
    id: "ae_t6",
    taskId: "t6",
    assistantId: "s_as_jotaro",
    amount: 9000,
    rateSnapshot: 3800,
    status: "calculated",
    approvedAt: "Jun 14",
    period: "2026-06",
  },
];

export const earningsForAssistant = (assistantId: string) =>
  assistantEarnings.filter((e) => e.assistantId === assistantId);
