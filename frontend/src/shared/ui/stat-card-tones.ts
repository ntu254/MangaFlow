export type StatCardTone =
  | "blue"
  | "emerald"
  | "amber"
  | "violet"
  | "orange"
  | "rose"
  | "sky"
  | "neutral"
  | "warning"
  | "danger"
  | "success";

// Editorial tokens only — tints of the role/semantic palette give the KPI tiles
// hue variety without the raw Tailwind palette. Tokens carry both light and dark
// values, so no `dark:` overrides are needed.
export const STAT_TONE_BG: Record<StatCardTone, string> = {
  blue: "bg-[var(--chart-3)]/12 text-[var(--chart-3)]",
  emerald: "bg-[var(--role-editor)]/12 text-[var(--role-editor)]",
  amber: "bg-[var(--role-board)]/12 text-[var(--role-board)]",
  violet: "bg-[var(--role-mangaka)]/12 text-[var(--role-mangaka)]",
  orange: "bg-accent/12 text-accent",
  rose: "bg-destructive/12 text-destructive",
  sky: "bg-[var(--role-assistant)]/12 text-[var(--role-assistant)]",
  neutral: "bg-muted text-foreground",
  warning: "bg-[var(--admin-gold)]/15 text-[var(--admin-gold)]",
  danger: "bg-destructive/12 text-destructive",
  success: "bg-emerald-100 text-emerald-800",
};
