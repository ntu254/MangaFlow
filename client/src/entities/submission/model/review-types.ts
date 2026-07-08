export type ReviewPriority = "HIGH" | "MED" | "LOW" | "BLOCKING";

export type DeadlineRisk = {
  tone: "rose" | "amber" | "emerald" | "neutral";
  label: string;
  days: number | null;
};
