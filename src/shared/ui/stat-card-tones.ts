export type StatCardTone =
  | "blue"
  | "emerald"
  | "amber"
  | "violet"
  | "orange"
  | "rose"
  | "sky"
  | "neutral";

export const STAT_TONE_BG: Record<StatCardTone, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  neutral: "bg-muted text-foreground",
};
