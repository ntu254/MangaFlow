import { useEffect, useState } from "react";
import { AlertOctagon, CheckCircle2, MessageSquare } from "lucide-react";
import type { StudioComment } from "@/entities/series/model/studio-types";
import type { StudioTask } from "@/entities/series/model/studio-types";
import type { ChapterPage, ChapterReview } from "@/entities/series/model/series-types";
import type { PublicationReadiness } from "../../model/editor-access";
import { StatCard, Panel } from "@/shared/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { chapterPageLabel } from "@/entities/chapter/model/chapter-pages";
import { formatDateTime } from "@/shared/lib/format-date";
import {
  commentText,
  commentTone,
  isBlocking,
  isTantouBlocking,
  TONE_DOT,
  TONE_PILL,
  type CommentStats,
} from "./review-helpers";

const CHECKLIST_ITEMS = [
  "Artwork quality",
  "Panel readability",
  "Dialogue placement",
  "Continuity",
  "File quality",
  "Publication readiness",
] as const;

function statusLabel(comment: StudioComment) {
  if (comment.status === "RESOLVED") return "Resolved";
  if (isBlocking(comment)) return "Blocking";
  if (comment.status === "ADDRESSED") return "Addressed";
  return "Open";
}

export function ReviewSummaryPanel({
  stats,
  readiness,
  page,
  tasks,
  pageComments,
  chapterReviews,
  regionLabel,
  canApprove,
  canRevise,
  isPending,
  canVerifyBlockingComments,
  isCommentActionPending,
  onApprove,
  onRequestRevision,
  onReject,
  onResolveComment,
  onReopenComment,
  assignedEditorId,
}: {
  stats: CommentStats;
  readiness: PublicationReadiness | null;
  page: ChapterPage | undefined;
  tasks: StudioTask[];
  pageComments: StudioComment[];
  chapterReviews: ChapterReview[];
  regionLabel: (regionId?: string) => string | undefined;
  canApprove: boolean;
  canRevise: boolean;
  isPending: boolean;
  canVerifyBlockingComments: boolean;
  isCommentActionPending: boolean;
  onApprove: () => void;
  onRequestRevision: (payload: Record<string, unknown>) => void;
  onReject: (payload: Record<string, unknown>) => void;
  onResolveComment: (comment: StudioComment) => void;
  onReopenComment: (comment: StudioComment) => void;
  assignedEditorId: string;
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
    ...tasks
      .filter((task) => task.regionId)
      .map((task) => ({
        value: `REGION:${task.regionId}`,
        label: `Region: ${regionLabel(task.regionId) ?? task.regionId}`,
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
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
      <p className="font-serif text-[15px] text-[var(--admin-ink)]">Review Summary</p>

      <div className="grid grid-cols-3 gap-2">
        <StatCard
          tone="rose"
          icon={<AlertOctagon className="size-4" />}
          label="Blocking issues"
          value={stats.blocking}
        />
        <StatCard
          tone="blue"
          icon={<MessageSquare className="size-4" />}
          label="Open comments"
          value={stats.open}
        />
        <StatCard
          tone="amber"
          icon={<CheckCircle2 className="size-4" />}
          label="Addressed awaiting check"
          value={stats.addressed}
        />
      </div>

      <Panel title="Checklist">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {CHECKLIST_ITEMS.map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 text-[12px] text-[var(--admin-ink)]"
            >
              <Checkbox
                checked={Boolean(checklist[item])}
                onCheckedChange={(value) =>
                  setChecklist((prev) => ({ ...prev, [item]: value === true }))
                }
              />
              {item}
            </label>
          ))}
        </div>
      </Panel>

      <Panel title="Review snapshot">
        {latestReview ? (
          <div className="space-y-2 text-[12px] text-[var(--admin-muted)]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[var(--admin-ink)]">Frozen review set</span>
              <span className="rounded bg-[var(--admin-hover)] px-1.5 py-0.5 text-[10px] font-semibold">
                {latestReview.status}
              </span>
            </div>
            <p>Pages frozen: {latestReview.pageVersionIds.length}</p>
            <p>Created: {formatDateTime(latestReview.createdAt)}</p>
            {latestReview.decidedAt ? (
              <p>Decided: {formatDateTime(latestReview.decidedAt)}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-[12px] text-[var(--admin-faint)]">
            No chapter review snapshot has been recorded yet.
          </p>
        )}
      </Panel>

      <Panel title={`Comments (${pageComments.length})`} contentClassName="p-0">
        {pageComments.length === 0 ? (
          <p className="px-4 py-3 text-[12px] text-[var(--admin-faint)]">
            No comments on this page yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {pageComments.map((c, i) => {
              const tone = commentTone(c);
              const region = regionLabel(c.regionId);
              const canVerify = canVerifyBlockingComments && isTantouBlocking(c, assignedEditorId);
              return (
                <li key={c.id} className="flex gap-2.5 px-4 py-2.5">
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${TONE_DOT[tone]}`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold text-[var(--admin-ink)]">
                        {pageLabel}
                        {region ? ` · ${region}` : ""}
                      </p>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${TONE_PILL[tone]}`}
                      >
                        {statusLabel(c)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--admin-faint)]">
                      {c.authorName} · {formatDateTime(c.createdAt)}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--admin-muted)]">{commentText(c)}</p>
                    {canVerify ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {c.status !== "RESOLVED" ? (
                          <button
                            type="button"
                            disabled={isCommentActionPending}
                            onClick={() => onResolveComment(c)}
                            className="rounded-[5px] bg-[var(--admin-navy)] px-2 py-1 text-[10px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)] disabled:opacity-40"
                          >
                            {c.status === "ADDRESSED" ? "Verify RESOLVED" : "Mark RESOLVED"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isCommentActionPending}
                            onClick={() => onReopenComment(c)}
                            className="rounded-[5px] border border-[var(--admin-border)] px-2 py-1 text-[10px] font-semibold text-[var(--admin-ink)] hover:bg-[var(--admin-hover)] disabled:opacity-40"
                          >
                            Reopen
                          </button>
                        )}
                        <span className="text-[10px] text-[var(--admin-faint)]">
                          Tantou verification
                        </span>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Decision">
        <label className="mb-2 block text-[11px] font-semibold text-[var(--admin-muted)]">
          Problem target
          <select
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className="mt-1 w-full rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-page)] px-3 py-2 text-[12px] text-[var(--admin-ink)] outline-none focus:border-[var(--admin-ink)]"
          >
            <option value="">Select target</option>
            {targetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Feedback or rejection reason..."
          rows={3}
          className="w-full resize-none rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-page)] px-3 py-2 text-[12px] text-[var(--admin-ink)] outline-none focus:border-[var(--admin-ink)]"
        />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={!canSendNegativeDecision || isPending}
            onClick={() => onRequestRevision(decisionPayload)}
            className="inline-flex items-center justify-center gap-1.5 rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[12px] font-semibold text-[var(--admin-ink)] hover:bg-[var(--admin-hover)] disabled:opacity-40"
          >
            Request Revision
          </button>
          <button
            type="button"
            disabled={!canSendNegativeDecision || isPending}
            onClick={() => onReject(decisionPayload)}
            className="inline-flex items-center justify-center gap-1.5 rounded-[6px] border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-40"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={!canApprove || isPending}
            onClick={onApprove}
            className="inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-[var(--admin-navy)] px-3 py-2 text-[12px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)] disabled:opacity-40"
          >
            Approve Chapter
          </button>
        </div>
      </Panel>
    </div>
  );
}
