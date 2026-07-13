import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { RestrictedActionTooltip } from "@/entities/access";
import { PageShell, PageHeader, PageSection } from "@/shared/layout/page-layout";
import { CsvFileUploader, CsvPreviewTable, validateCsvRows, type CsvPreviewRow } from "@/shared/ui";
import { RankingImportPreview } from "./ranking-import-preview";
import { useImportRankingsMutation, type RankingImportRow } from "../api/rankings.mutations";
import type { RankingImportJob, RankingPeriod } from "@/entities/board/model/board-types";
import { RANKING_SOURCES, getRankingSourceLabel } from "../model/ranking-source-utils";

const DEFAULT_PERIODS: RankingPeriod[] = [
  {
    id: new Date().toISOString().slice(0, 7),
    label: "Current month",
    issue: new Date().toISOString().slice(0, 7),
    status: "DRAFT",
  },
];

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
  const periods = DEFAULT_PERIODS;
  const [jobs, setJobs] = useState<RankingImportJob[]>([]);
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const [source, setSource] = useState("SURVEY");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

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
      toast.error("CSV must include a period and at least one data row.");
      return;
    }
    try {
      const result = await importRankings.mutateAsync({
        csvData: csvText,
        period: periodId,
        source,
        fileName: fileName ?? "manual-ranking.csv",
        rows: importRows,
      });
      setJobs((current) => [
        {
          id: `ranking-import-${Date.now()}`,
          periodId,
          fileName: result.fileName ?? fileName ?? "manual-ranking.csv",
          status: "VALIDATED",
          rowCount: result.imported,
          errors: [],
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
      toast.success(`Imported ${result.imported} ranking rows.`);
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
            Period
            <select
              aria-label="Select period"
              value={periodId}
              onChange={(event) => setPeriodId(event.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Issue
            <input
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              value={periods.find((p) => p.id === periodId)?.issue ?? ""}
              readOnly
            />
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
              : `Submit import (${validRowCount} valid rows)`}
          </button>
          <RestrictedActionTooltip reason="CALLBACK_MISSING">
            <button
              disabled
              className="rounded bg-foreground px-3 py-2 text-xs font-semibold text-background opacity-40"
            >
              Finalize
            </button>
          </RestrictedActionTooltip>
        </div>
      </PageSection>
      <RankingImportPreview jobs={jobs} />
    </div>
  );
}
