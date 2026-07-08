import { Link } from "@tanstack/react-router";
import type { ReviewItem } from "../../model/editor-access";
import { formatDate, isOverdue } from "@/shared/lib/format-date";
import { ReviewStatusPill, PriorityPill } from "@/entities/submission";
import type { QueueAccent, QueueColumn } from "@/shared/ui";

const KIND_LABEL: Record<ReviewItem["kind"], string> = {
  PROPOSAL_PACKAGE: "Proposal Package",
  PROPOSAL: "Proposal",
  STORYBOARD: "Storyboard",
  MANUSCRIPT: "Manuscript",
  CHAPTER: "Chapter",
  PAGE: "Page",
  SUBMISSION: "Submission",
};

const COMPLETED_STATUSES = new Set([
  "CHANGES_REQUESTED",
  "PENDING_BOARD",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
]);

const INCLUDE_LABEL: Record<NonNullable<ReviewItem["includes"]>[number], string> = {
  PROPOSAL: "Proposal",
  MANUSCRIPT: "Manuscript",
  SAMPLE_PAGES: "Sample pages",
  MATERIALS: "Materials",
};

export function isItemCompleted(item: ReviewItem) {
  return Boolean(item.isCompleted) || COMPLETED_STATUSES.has(item.status);
}

export function isItemOverdue(item: ReviewItem) {
  return !isItemCompleted(item) && isOverdue(item.deadline ?? undefined);
}

function includesFor(item: ReviewItem) {
  if (item.includes?.length) {
    return item.includes.map((include) => INCLUDE_LABEL[include]).join(" + ");
  }
  return KIND_LABEL[item.kind];
}

function linkFor(item: ReviewItem) {
  switch (item.kind) {
    case "PROPOSAL_PACKAGE":
    case "PROPOSAL":
    case "MANUSCRIPT":
      return {
        to: "/app/editor/proposals/$proposalId" as const,
        params: { proposalId: item.proposalId ?? item.refId },
      };
    case "STORYBOARD":
      return {
        to: "/app/editor/storyboards/$storyboardId/review" as const,
        params: { storyboardId: item.refId },
      };
    case "CHAPTER":
    case "PAGE":
      return {
        to: "/app/editor/chapters/$chapterId/review" as const,
        params: { chapterId: item.chapterId ?? item.refId },
      };
    case "SUBMISSION":
      return {
        to: "/app/editor/review/$submissionId" as const,
        params: { submissionId: item.refId },
      };
  }
}

function actionFor(item: ReviewItem, currentUserId: string) {
  if (item.kind === "SUBMISSION") return "Open Review";
  if (item.status === "PENDING_BOARD") return "View Board";
  if (isItemCompleted(item)) return "View";
  if (item.claimedByEditorId && item.claimedByEditorId !== currentUserId) return "View Only";
  if (item.claimedByEditorId === currentUserId) return "Continue";
  if (item.kind === "PROPOSAL_PACKAGE" || item.kind === "PROPOSAL" || item.kind === "MANUSCRIPT")
    return "Start Review";
  return "Open Review";
}

function dueLabel(item: ReviewItem) {
  if (!item.deadline) return "—";
  if (isItemOverdue(item)) return `Overdue`;
  return formatDate(item.deadline);
}

export function reviewRowAccent(item: ReviewItem): QueueAccent {
  if (isItemOverdue(item)) return "rose";
  if (item.priority === "BLOCKING") return "rose";
  if (item.priority === "HIGH") return "amber";
  return null;
}

export function reviewQueueColumns(currentUserId: string): QueueColumn<ReviewItem>[] {
  return [
    {
      key: "priority",
      header: "Priority",
      className: "w-[84px]",
      render: (item) => <PriorityPill p={item.priority} />,
    },
    {
      key: "item",
      header: "Review item",
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-page)] font-serif text-[13px] text-[var(--admin-muted)]">
            {(item.seriesTitle ?? item.title ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--admin-ink)]">{item.title}</p>
            <p className="truncate text-[11px] text-[var(--admin-faint)]">
              {item.seriesTitle ?? "—"} · {includesFor(item)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-[140px]",
      render: (item) => <ReviewStatusPill status={item.status} />,
    },
    {
      key: "due",
      header: "Due",
      className: "w-[88px]",
      render: (item) => (
        <span
          className={
            isItemOverdue(item)
              ? "text-[12px] font-semibold text-rose-600"
              : "text-[12px] text-[var(--admin-muted)]"
          }
        >
          {dueLabel(item)}
        </span>
      ),
    },
    {
      key: "revision",
      header: "Revision",
      className: "w-[108px]",
      render: (item) =>
        item.revisionReturned ? (
          <span className="inline-flex rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-900">
            Resubmitted
          </span>
        ) : (
          <span className="text-[12px] text-[var(--admin-faint)]">—</span>
        ),
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      className: "w-[116px]",
      render: (item) => {
        const action = actionFor(item, currentUserId);
        const isView = action.startsWith("View");
        return (
          <Link
            {...linkFor(item)}
            className={
              isView
                ? "inline-flex justify-center rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 text-[11px] font-semibold text-[var(--admin-ink)] hover:bg-[var(--admin-hover)]"
                : "inline-flex justify-center rounded-[6px] bg-[var(--admin-navy)] px-3 py-1.5 text-[11px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)]"
            }
          >
            {action}
          </Link>
        );
      },
    },
  ];
}
