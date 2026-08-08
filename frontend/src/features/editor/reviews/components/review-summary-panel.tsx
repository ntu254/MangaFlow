import { useEffect, useState } from "react";
import { AlertOctagon, CheckCircle2, RotateCcw, XCircle, ShieldCheck } from "lucide-react";
import type { StudioTask } from "@/entities/series/model/studio-types";
import type { ChapterPage, ChapterReview } from "@/entities/series/model/series-types";
import type { PublicationReadiness } from "../../model/editor-access";
import { Checkbox } from "@/components/ui/checkbox";
import { chapterPageLabel } from "@/entities/chapter/model/chapter-pages";
import { formatDateTime } from "@/shared/lib/format-date";
import type { CommentStats } from "./review-helpers";

const CHECKLIST_ITEMS = [
  "Artwork quality",
  "Panel readability",
  "Dialogue placement",
  "Continuity",
  "File quality",
  "Publication readiness",
] as const;

export function ReviewSummaryPanel({
  stats,
  readiness,
  page,
  tasks,
  chapterReviews,
  canApprove,
  canRevise,
  isPending,
  onApprove,
  onRequestRevision,
  onReject,
}: {
  stats: CommentStats;
  readiness: PublicationReadiness | null;
  page: ChapterPage | undefined;
  tasks: StudioTask[];
  chapterReviews: ChapterReview[];
  canApprove: boolean;
  canRevise: boolean;
  isPending: boolean;
  onApprove: () => void;
  onRequestRevision: (payload: Record<string, unknown>) => void;
  onReject: (payload: Record<string, unknown>) => void;
  // Unused legacy props for backward compatibility signature
  pageComments?: unknown;
  regionLabel?: unknown;
  canVerifyBlockingComments?: unknown;
  isCommentActionPending?: unknown;
  taskActionsPending?: unknown;
  onTaskAction?: unknown;
  onResolveComment?: unknown;
  onReopenComment?: unknown;
  assignedEditorId?: unknown;
}) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => ({
    "File quality": Boolean(readiness && readiness.pagesUploaded > 0),
    "Publication readiness": Boolean(readiness?.ready),
  }));
  const [note, setNote] = useState("");
  const [targetValue, setTargetValue] = useState(() => (page ? `PAGE:${page.id}` : ""));
  const pageLabel = page ? `Page ${chapterPageLabel(page)}` : "Page";

  useEffect(() => {
    setTargetValue(page ? `PAGE:${page.id}` : "");
  }, [page]);

  const targetOptions = [
    ...(page ? [{ value: `PAGE:${page.id}`, label: `${pageLabel} issue` }] : []),
    ...tasks.map((task) => ({
      value: `TASK:${task.id}`,
      label: `Task: ${task.title}`,
    })),
  ];

  const selectedTarget = targetValue.split(":");
  const activeReview = chapterReviews.find((review) => review.status === "OPEN");
  const latestReview = activeReview ?? chapterReviews[0];
  const decisionPayload = {
    targetType: selectedTarget[0],
    targetId: selectedTarget.slice(1).join(":"),
    feedback: note.trim(),
    reason: note.trim(),
    comment: note.trim(),
  };
  const canSendNegativeDecision = canRevise && Boolean(targetValue) && note.trim().length > 0;

  return (
    <div className="flex h-full flex-col min-h-0 divide-y divide-border/60 bg-card/60 overflow-y-auto">
      {/* Executive Header & Readiness Status */}
      <div className="p-3 bg-muted/20 space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-serif font-bold text-xs text-foreground uppercase tracking-wider">
            Editorial Decision Console
          </p>
        </div>

        {/* Readiness Banner */}
        <div
          className={`flex items-center gap-2 rounded-xl p-2 text-xs font-semibold border ${
            readiness?.ready
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : stats.blocking > 0
                ? "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300"
                : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
          }`}
        >
          {readiness?.ready ? (
            <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertOctagon className="size-4 shrink-0 text-rose-500" />
          )}
          <span className="truncate">
            {readiness?.ready
              ? "Chapter is Ready for Publication"
              : stats.blocking > 0
                ? `${stats.blocking} Blocking Issues Pending`
                : "Under Review / Revisions Pending"}
          </span>
        </div>
      </div>

      {/* KPI Stat Pills Bar */}
      <div className="p-3">
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2">
            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Blocking</p>
            <p className="text-base font-extrabold text-rose-700 dark:text-rose-300 tabular-nums">
              {stats.blocking}
            </p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Addressed</p>
            <p className="text-base font-extrabold text-amber-700 dark:text-amber-300 tabular-nums">
              {stats.addressed}
            </p>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2">
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Open</p>
            <p className="text-base font-extrabold text-blue-700 dark:text-blue-300 tabular-nums">
              {stats.open}
            </p>
          </div>
        </div>
      </div>

      {/* Editorial QC Checklist */}
      <div className="p-3 space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Editorial QC Checklist
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CHECKLIST_ITEMS.map((item) => (
            <label
              key={item}
              className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card p-2 text-[11px] font-semibold text-foreground cursor-pointer hover:border-primary/40 transition-colors"
            >
              <Checkbox
                checked={Boolean(checklist[item])}
                onCheckedChange={(value) =>
                  setChecklist((prev) => ({ ...prev, [item]: value === true }))
                }
              />
              <span className="truncate">{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Decision Action Console Form */}
      <div className="p-3 space-y-3">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Editorial Decision & Actions
        </p>

        <div className="space-y-2">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Target Problem Layer / Page
            </label>
            <select
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            >
              <option value="">Select Target (Optional)</option>
              {targetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Editorial Instructions / Feedback
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter revision notes or rejection details..."
              rows={3}
              className="w-full resize-none rounded-lg border border-border/80 bg-background p-2.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary shadow-2xs placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={!canSendNegativeDecision || isPending}
              onClick={() => onRequestRevision(decisionPayload)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 disabled:opacity-40 shadow-2xs cursor-pointer transition-colors"
            >
              <RotateCcw className="size-3.5" /> Request Revision
            </button>
            <button
              type="button"
              disabled={!canSendNegativeDecision || isPending}
              onClick={() => onReject(decisionPayload)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 shadow-2xs cursor-pointer transition-colors"
            >
              <XCircle className="size-3.5" /> Reject Chapter
            </button>
          </div>

          <button
            type="button"
            disabled={!canApprove || isPending}
            onClick={onApprove}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 shadow-2xs cursor-pointer transition-colors"
          >
            <CheckCircle2 className="size-4" /> Approve Chapter for Release
          </button>
        </div>
      </div>

      {/* Review Snapshot Footer Card */}
      <div className="p-3 bg-muted/10 space-y-1.5 text-xs text-muted-foreground mt-auto">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-foreground text-[11px]">Snapshot Version</span>
          <span className="rounded-full bg-muted border border-border/60 px-2 py-0.5 text-[10px] font-bold text-foreground uppercase">
            {latestReview ? latestReview.status : "DRAFT"}
          </span>
        </div>
        {latestReview && (
          <p className="text-[10px]">
            Frozen: <span className="font-semibold text-foreground">{latestReview.pageVersionIds.length} pages</span> · {formatDateTime(latestReview.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}
