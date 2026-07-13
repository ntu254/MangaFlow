import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import type { Chapter } from "@/entities/series/model/series-types";
import { useChapterReadinessQuery } from "../../api/series-queries";

type Check = { ok: boolean; label: string; hint?: string };

const BE_LABELS: Record<string, { ok: string; fail: string }> = {
  allTasksApproved: {
    ok: "All task Studio has Mangaka-approve",
    fail: "Some Studio tasks have not been approved by the Mangaka",
  },
  allSubmissionsApproved: {
    ok: "All submission has Mangaka-approve",
    fail: "Some submissions have not been approved by the Mangaka",
  },
  allCommentsResolved: {
    ok: "No remaining blocking comments on pages, regions, tasks, or submissions",
    fail: "Some blocking comments are unresolved (page/region/task/submission)",
  },
};

const BE_KEYS = [
  "allTasksApproved",
  "allSubmissionsApproved",
  "allCommentsResolved",
];

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
  const unresolved = chapter.reviewNotes.filter((n) => !n.resolved).length;
  const hasPages = chapter.pages.length > 0;
  const hasAssignee = Boolean(chapter.assigneeId);
  const hasDeadline = Boolean(chapter.draftDueAt || chapter.reviewDueAt);

  const checks: Check[] = [
    {
      ok: hasPages,
      label: hasPages
        ? `Pages has upload (${chapter.pages.length})`
        : "No pages have been uploaded yet",
    },
    {
      ok: unresolved === 0,
      label:
        unresolved === 0 ? "No remaining blocking notes" : `${unresolved} unresolved blocking note`,
    },
    {
      ok: hasAssignee,
      label: hasAssignee ? `Assignee: ${chapter.assigneeName}` : "No assignee",
    },
    {
      ok: hasDeadline,
      label: hasDeadline ? "Deadline set" : "No draft/review deadline",
    },
  ];

  for (const key of BE_KEYS) {
    const item = beReadiness?.items.find((it) => it.key === key);
    if (item) {
      const labels = BE_LABELS[key];
      checks.push({
        ok: item.passed,
        label: item.passed ? labels.ok : (item.reason ?? labels.fail),
      });
    }
  }

  const ready = checks.every((c) => c.ok);
  const passCount = checks.filter((c) => c.ok).length;

  if (compact) {
    return (
      <div className={flat ? "" : "rounded-md border border-border bg-card p-3"}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold">
              Ready {passCount}/{checks.length}
            </span>
            {ready ? (
              <CheckCircle2 className="size-3.5 text-emerald-600" />
            ) : (
              <Circle className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {checks.map((c, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${
                  c.ok
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-rose-300 bg-rose-50 text-rose-700"
                }`}
              >
                {c.ok ? <CheckCircle2 className="size-2.5" /> : <XCircle className="size-2.5" />}
                {c.ok ? "✓" : "✕"}
              </span>
            ))}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
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
    <div className={flat ? "" : "rounded-md border border-border bg-card p-4"}>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Readiness for Editor Review
      </p>
      <ul className="space-y-1.5 text-xs">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2">
            {c.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
            )}
            <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
          </li>
        ))}
        <li className="flex items-start gap-2 border-t border-border pt-2">
          {ready ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          ) : (
            <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          )}
          <span className={`font-semibold ${ready ? "text-emerald-700" : "text-muted-foreground"}`}>
            {ready ? "Ready for Editor Review" : "Not ready for Editor Review"}
          </span>
        </li>
      </ul>
    </div>
  );
}
