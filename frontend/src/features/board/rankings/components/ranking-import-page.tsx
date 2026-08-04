import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { PageShell, PageHeader, PageSection } from "@/shared/layout/page-layout";
import { CsvFileUploader, CsvPreviewTable, validateCsvRows, type CsvPreviewRow } from "@/shared/ui";
import { RankingImportPreview } from "./ranking-import-preview";
import {
  useImportRankingsMutation,
  useRankingPeriodsQuery,
  type RankingImportRow,
} from "../api/rankings.mutations";
import type { RankingImportJob } from "@/entities/board/model/board-types";
import { RANKING_SOURCES, getRankingSourceLabel } from "../model/ranking-source-utils";

type RankingCadence = "WEEKLY" | "MONTHLY";

function currentPeriodFor(cadence: RankingCadence): string {
  const now = new Date();
  if (cadence === "MONTHLY") return now.toISOString().slice(0, 7);
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function cadenceLabel(cadence?: RankingCadence): string {
  return cadence === "WEEKLY" ? "Weekly" : cadence === "MONTHLY" ? "Monthly" : "Imported";
}

function csvTextToRows(csv: string): Record<string, string>[] {
  const lines = csv
    .trim()
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

function rowsToImportRows(rawRows: Record<string, string>[]): RankingImportRow[] {
  return rawRows.map((record) => ({
    seriesId: record.seriesId || undefined,
    seriesTitle: record.seriesTitle || record.series || undefined,
    score: record.score ? Number(record.score) : undefined,
    finalScore: record.finalScore ? Number(record.finalScore) : undefined,
    readerScore: record.readerScore ? Number(record.readerScore) : undefined,
    votes: record.votes ? Number(record.votes) : undefined,
    voteCount: record.voteCount ? Number(record.voteCount) : undefined,
    status: record.status || undefined,
    atRisk: record.atRisk ? record.atRisk.toLowerCase() === "true" : undefined,
  }));
}

/** Standalone page wrapper (kept for the /app/board/rankings/import route). */
export function RankingImportPage() {
  return (
    <PageShell maxWidth="5xl">
      <PageHeader
        eyebrow="Governance"
        title="Ranking import"
        description="Upload a CSV file, preview parsed rows, then submit ranking data into the live Board read model."
      />
      <RankingImportPanel />
    </PageShell>
  );
}

/** Embeddable import form (no page chrome) — reused inside the Rankings page. */
export function RankingImportPanel() {
  const { data: backendPeriods = [] } = useRankingPeriodsQuery();
  const [cadence, setCadence] = useState<RankingCadence>("MONTHLY");
  const [periodId, setPeriodId] = useState(() => currentPeriodFor("MONTHLY"));
  const [source, setSource] = useState("SURVEY");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [jobs, setJobs] = useState<RankingImportJob[]>([]);

  const periodOptions = useMemo(() => {
    const options = new Map<string, { label: string; cadence: RankingCadence; imported: boolean }>();
    options.set(currentPeriodFor("MONTHLY"), {
      label: `Current month (${currentPeriodFor("MONTHLY")})`,
      cadence: "MONTHLY",
      imported: false,
    });
    options.set(currentPeriodFor("WEEKLY"), {
      label: `Current week (${currentPeriodFor("WEEKLY")})`,
      cadence: "WEEKLY",
      imported: false,
    });
    for (const period of backendPeriods) {
      const cad = period.cadence ?? (period.period.match(/^\d{4}-W\d{2}$/) ? "WEEKLY" : "MONTHLY");
      options.set(period.period, {
        label: `${period.period} (${cadenceLabel(cad)})`,
        cadence: cad,
        imported: true,
      });
    }
    return [...options.entries()];
  }, [backendPeriods]);

  const switchCadence = (next: RankingCadence) => {
    setCadence(next);
    setPeriodId(currentPeriodFor(next));
  };

  const rawRows = useMemo(() => csvTextToRows(csvText), [csvText]);
  const previewRows: CsvPreviewRow[] = useMemo(() => validateCsvRows(rawRows), [rawRows]);
  const importRows: RankingImportRow[] = useMemo(() => rowsToImportRows(rawRows), [rawRows]);
  const validRowCount = useMemo(() => previewRows.filter((r) => r.valid).length, [previewRows]);
  const importRankings = useImportRankingsMutation();

  const handleFileContent = useCallback((content: string, name: string) => {
    setCsvText(content);
    setFileName(name);
  }, []);

  const handleSubmit = async () => {
    if (!periodId || importRows.length === 0) {
      toast.error("CSV must have a period and at least one data row.");
      return;
    }
    try {
      const result = await importRankings.mutateAsync({
        period: periodId,
        cadence,
        source,
        fileName: fileName ?? "manual-ranking.csv",
        rows: importRows,
      });
      setJobs((current) => [
        {
          id: `ranking-import-${Date.now()}`,
          periodId: `${cadence === "WEEKLY" ? "Week" : "Month"} ${periodId}`,
          fileName: result.fileName ?? fileName ?? "manual-ranking.csv",
          status: "IMPORTED",
          rowCount: result.imported,
          errors: [],
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
      toast.success(`Imported ${result.imported} ranking rows for ${periodId}.`);
      setCsvText("");
      setFileName(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import ranking.");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <PageSection>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold">
            Cadence
            <select
              aria-label="Select cadence"
              value={cadence}
              onChange={(event) => switchCadence(event.target.value as RankingCadence)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            >
              <option value="WEEKLY">Weekly (YYYY-W##)</option>
              <option value="MONTHLY">Monthly (YYYY-MM)</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Period
            <select
              aria-label="Select period"
              value={periodId}
              onChange={(event) => setPeriodId(event.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            >
              {periodOptions
                .filter(([, info]) => info.cadence === cadence)
                .map(([period, info]) => (
                  <option key={period} value={period}>
                    {info.label}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Ranking Source
            <select
              aria-label="Select ranking source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            >
              {RANKING_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {getRankingSourceLabel(src)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Importing into an existing period re-imports (upserts) its rows and recomputes ranks
          immediately. There is no separate finalize step in this MVP — imports are live.
        </p>

        <div className="mt-4">
          <CsvFileUploader onFileContent={handleFileContent} disabled={importRankings.isPending} />
        </div>

        <CsvPreviewTable rows={previewRows} />

        <div className="mt-3 flex gap-2">
          <button
            disabled={importRankings.isPending || validRowCount === 0}
            onClick={handleSubmit}
            className="rounded bg-foreground px-3 py-2 text-xs font-semibold text-background disabled:opacity-40"
          >
            {importRankings.isPending
              ? "Submitting..."
              : `Import (${validRowCount} valid rows)`}
          </button>
          {jobs[0]?.status === "IMPORTED" ? (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              Imported
            </span>
          ) : null}
        </div>
      </PageSection>
      <RankingImportPreview jobs={jobs} />
    </div>
  );
}
