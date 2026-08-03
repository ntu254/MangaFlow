import type { IconName } from "@/design/icons";

export type Role = "board" | "editor";

export type Tone = "primary" | "success" | "warning" | "danger" | "neutral";

export interface MetricItem {
  id: string;
  label: string;
  value: string;
  tone: Tone;
  icon: IconName;
  subtitle?: string;
  actionLabel?: string;
}

export interface QueueItem {
  id: string;
  title: string;
  subtitle: string;
  value?: string;
  tone: Tone;
  icon?: IconName;
}

export interface SeriesCard {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  tone: Tone;
  progress?: string;
  progressValue?: number;
  coverTone: "violet" | "red" | "blue" | "dark" | "warm" | "mono";
  tags?: string[];
}

export type AtRiskDecision =
  | "CONTINUE"
  | "WARNING"
  | "REQUEST_IMPROVEMENT_PLAN"
  | "CANCEL";
