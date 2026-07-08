export type RankingSource =
  | "SURVEY"
  | "PLATFORM_ANALYTICS"
  | "MANUAL_IMPORT"
  | "SALES"
  | "EDITOR_NOTE";

export const RANKING_SOURCES: RankingSource[] = [
  "SURVEY",
  "PLATFORM_ANALYTICS",
  "MANUAL_IMPORT",
  "SALES",
  "EDITOR_NOTE",
];

const SOURCE_LABEL: Record<RankingSource, string> = {
  SURVEY: "Survey",
  PLATFORM_ANALYTICS: "Platform analytics",
  MANUAL_IMPORT: "Manual import",
  SALES: "Sales",
  EDITOR_NOTE: "Editor note",
};

export function normalizeRankingSource(source?: string): RankingSource | "UNKNOWN" {
  const value = source?.trim().toUpperCase();
  return RANKING_SOURCES.includes(value as RankingSource) ? (value as RankingSource) : "UNKNOWN";
}

export function getRankingSourceLabel(source?: string): string {
  const normalized = normalizeRankingSource(source);
  return normalized === "UNKNOWN" ? "—" : SOURCE_LABEL[normalized];
}

export function getRankingSourceTone(source?: string): string {
  switch (normalizeRankingSource(source)) {
    case "SURVEY":
      return "bg-sky-100 text-sky-900";
    case "PLATFORM_ANALYTICS":
      return "bg-violet-100 text-violet-900";
    case "MANUAL_IMPORT":
      return "bg-zinc-100 text-zinc-800";
    case "SALES":
      return "bg-emerald-100 text-emerald-900";
    case "EDITOR_NOTE":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function formatRankingMetric(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    if (value > 0 && value < 1) return `${Math.round(value * 100)}%`;
    return value.toLocaleString();
  }
  return String(value);
}

export function summarizeRankingSources(rows: Array<{ source?: string }>): string {
  const sources = Array.from(
    new Set(
      rows
        .map((row) => normalizeRankingSource(row.source))
        .filter((source) => source !== "UNKNOWN"),
    ),
  );
  if (sources.length === 0) return "Source: —";
  if (sources.length === 1) return `Source: ${sources[0]}`;
  return `Sources: ${sources.join(" + ")}`;
}
