import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import type { Chapter } from "@/entities/series/model/series-types";
import { useChapterReadinessQuery } from "../../api/series-queries";
import { isCanonicalChapterReady } from "../model/chapter-readiness";

type Check = { ok: boolean; label: string; hint?: string };

const BE_LABELS: Record<string, { ok: string; fail: string }> = {
  allTasksApproved: {
    ok: "All Studio tasks Mangaka-approved",
    fail: "Studio tasks not yet Mangaka-approved",
  },
  allSubmissionsApproved: {
    ok: "All submissions Mangaka-approved",
    fail: "Submissions not yet Mangaka-approved",
  },
  allCommentsResolved: {
    ok: "No blocking comments on page/region/task/submission",
    fail: "Unresolved blocking comments (page/region/task/submission)",
  },
};

export function ChapterReadiness({
  chapter,
  flat = false,
  compact = false,
}: {
  chapter: Chapter;
  flat?: boolean;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: beReadiness } = useChapterReadinessQuery(chapter.id);
  const checks: Check[] = beReadiness
    ? beReadiness.items.map((item) => {
        const labels = BE_LABELS[item.key];
        return {
          ok: item.passed,
          label: item.passed ? (labels?.ok ?? item.key) : (item.reason ?? labels?.fail ?? item.key),
        };
      })
    : [{ ok: false, label: "Loading canonical readiness checks" }];
  const ready = isCanonicalChapterReady(beReadiness);
  const passCount = checks.filter((c) => c.ok).length;

  if (compact) {
    return (
      <div className={flat ? "" : "rounded-md border border-border bg-card p-2.5"}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold ${
                ready
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {ready ? (
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
              )}
              Ready {passCount}/{checks.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {checks.map((c, i) => (
              <span
                key={i}
                title={c.label}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all ${
                  c.ok
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                }`}
              >
                {c.ok ? (
                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="size-3 text-amber-600 dark:text-amber-400" />
                )}
                <span className="max-w-[180px] truncate">{c.label}</span>
              </span>
            ))}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Details
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>
        {expanded && (
          <ul className="mt-2 space-y-1 border-t border-border pt-2 text-xs">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                {c.ok ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-rose-600" />
                )}
                <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className={flat ? "" : "rounded-md border border-border bg-card p-3"}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Readiness checklist
        </p>
        <span
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
            ready
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}
        >
          {ready ? (
            <>
              <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
              READY ({passCount}/{checks.length})
            </>
          ) : (
            <>
              <XCircle className="size-3 text-amber-600 dark:text-amber-400" />
              {passCount}/{checks.length} PASSED
            </>
          )}
        </span>
      </div>
      <ul className="space-y-1.5">
        {checks.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px]">
            {c.ok ? (
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            <span className={c.ok ? "text-foreground/90 font-medium" : "text-muted-foreground"}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
