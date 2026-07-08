import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface CsvPreviewRow {
  index: number;
  raw: Record<string, string>;
  valid: boolean;
  errors: string[];
}

interface CsvPreviewTableProps {
  rows: CsvPreviewRow[];
  maxVisible?: number;
}

export function CsvPreviewTable({ rows, maxVisible = 50 }: CsvPreviewTableProps) {
  const headers = useMemo(() => {
    if (rows.length === 0) return [];
    return Object.keys(rows[0].raw);
  }, [rows]);

  const visibleRows = rows.slice(0, maxVisible);
  const hiddenCount = rows.length - visibleRows.length;
  const errorCount = rows.filter((r) => !r.valid).length;

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Preview
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{rows.length} rows</span>
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-amber-600">
              <AlertTriangle className="size-3" />
              {errorCount} invalid
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5">#</th>
              {headers.map((h) => (
                <th key={h} className="px-2 py-1.5">
                  {h}
                </th>
              ))}
              <th className="px-2 py-1.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={row.index}
                className={cn("border-t border-border/60", !row.valid && "bg-amber-50/50")}
              >
                <td className="px-2 py-1.5 font-mono text-muted-foreground">{row.index + 1}</td>
                {headers.map((h) => (
                  <td key={h} className="px-2 py-1.5 font-mono">
                    {row.raw[h] ?? ""}
                  </td>
                ))}
                <td className="px-2 py-1.5">
                  {row.valid ? (
                    <span className="text-emerald-600">OK</span>
                  ) : (
                    <span className="text-amber-600" title={row.errors.join("; ")}>
                      {row.errors[0]}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hiddenCount > 0 && (
        <p className="text-[10px] text-muted-foreground">+ {hiddenCount} more rows not shown</p>
      )}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function validateCsvRows(rows: Record<string, string>[]): CsvPreviewRow[] {
  return rows.map((raw, index) => {
    const errors: string[] = [];
    const hasSeriesId = Boolean(raw.seriesId?.trim());
    const hasSeriesTitle = Boolean(raw.seriesTitle?.trim() || raw.series?.trim());
    if (!hasSeriesId && !hasSeriesTitle) {
      errors.push("Missing seriesId or seriesTitle");
    }
    const score = raw.score ? Number(raw.score) : undefined;
    const finalScore = raw.finalScore ? Number(raw.finalScore) : undefined;
    if (score !== undefined && (score < 0 || score > 10)) {
      errors.push("Score must be 0-10");
    }
    if (finalScore !== undefined && (finalScore < 0 || finalScore > 10)) {
      errors.push("finalScore must be 0-10");
    }
    const votes = raw.votes ? Number(raw.votes) : undefined;
    if (votes !== undefined && (!Number.isInteger(votes) || votes < 0)) {
      errors.push("votes must be a non-negative integer");
    }
    return { index, raw, valid: errors.length === 0, errors };
  });
}
