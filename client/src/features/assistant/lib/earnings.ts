import {
  assistantEarnings,
  type AssistantEarning,
  type AssistantEarningStatus,
} from "@/entities";

export const EARNING_STATUSES: AssistantEarningStatus[] = [
  "calculated",
  "confirmed",
  "paid",
  "voided",
];

export const EARNING_LABEL: Record<AssistantEarningStatus, string> = {
  calculated: "Calculated",
  confirmed: "Confirmed",
  paid: "Paid",
  voided: "Voided",
};

export function earningsBy(assistantId: string): AssistantEarning[] {
  return assistantEarnings.filter((e) => e.assistantId === assistantId);
}

export function totalsBy(assistantId: string) {
  const list = earningsBy(assistantId);
  const sum = (s: AssistantEarningStatus) =>
    list.filter((e) => e.status === s).reduce((a, b) => a + b.amount, 0);
  return {
    thisMonth: sum("calculated") + sum("confirmed") + sum("paid"),
    pending: sum("calculated"),
    confirmed: sum("confirmed"),
    paid: sum("paid"),
    ytd: list.reduce((a, b) => a + (b.status === "voided" ? 0 : b.amount), 0),
  };
}
