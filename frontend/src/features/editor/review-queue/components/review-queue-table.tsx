import { Link } from "@tanstack/react-router";
import type { ReviewItem } from "../../model/editor-access";
import { formatDate, formatDateTime, isOverdue, timeAgo } from "@/shared/lib/format-date";
import { ReviewStatusPill, PriorityPill } from "@/entities/submission";
import type { QueueAccent, QueueColumn } from "@/shared/ui";
import { ResolvedImage } from "@/shared/ui/resolved-image";

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

const NEW_REVIEW_STATUSES = new Set(["PENDING_EDITOR", "TANTOU_REVIEW", "MANGAKA_APPROVED"]);

export function isNewReviewItem(item: ReviewItem) {
  return !isItemCompleted(item) && NEW_REVIEW_STATUSES.has(item.status);
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
        to: "/app/editor/series/submission/$submissionId" as const,
        params: { submissionId: item.refId },
      };
  }
}

function actionFor(item: ReviewItem, currentUserId: string) {
  if (item.kind === "SUBMISSION") return "Open Review";
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

export function reviewQueueColumns(
  currentUserId: string,
  items: ReviewItem[] = [],
): QueueColumn<ReviewItem>[] {
  const showDue = items.some((item) => item.deadline);
  const showVersion = items.some((item) => item.version !== undefined);

  const columns: QueueColumn<ReviewItem>[] = [
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      className: "w-[84px]",
      render: (item) => <PriorityPill p={item.priority} />,
    },
    {
      key: "item",
      header: "Review item",
      sortable: true,
      render: (item) => {
        const isProposal = item.kind === "PROPOSAL_PACKAGE";
        const mainTitle = isProposal ? (item.proposalTitle ?? item.title) : item.title;
        const subtitle = isProposal
          ? `Proposal Package${item.includes?.length ? ` • ${includesFor(item)}` : ""}`
          : `${item.seriesTitle ?? "—"} • ${includesFor(item)}`;
        return (
          <div className="flex items-center gap-3">
            <ResolvedImage
              fileKey={item.coverFileKey}
              fallbackUrl={item.coverUrl}
              alt={item.seriesTitle ?? item.title ?? "Cover"}
              className="size-9 shrink-0 rounded-xl border border-border object-cover shadow-2xs"
              fallback={
                <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 font-serif text-sm font-bold text-primary shadow-2xs">
                  {(item.seriesTitle ?? item.title ?? "?").slice(0, 1).toUpperCase()}
                </div>
              }
            />
            <div className="min-w-0" title={`ID: ${item.proposalId ?? item.refId}`}>
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate font-semibold text-foreground text-xs sm:text-sm">
                  {mainTitle}
                </p>
                {isNewReviewItem(item) ? (
                  <span className="shrink-0 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    New
                  </span>
                ) : null}
              </div>
              <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      className: "w-[140px]",
      render: (item) => <ReviewStatusPill status={item.status} />,
    },
    {
      key: "submitted",
      header: "Submitted",
      sortable: true,
      className: "w-[110px]",
      render: (item) => (
        <span className="text-xs text-muted-foreground" title={formatDateTime(item.submittedAt)}>
          {timeAgo(item.submittedAt)}
        </span>
      ),
    },
  ];

  if (showDue) {
    columns.push({
      key: "due",
      header: "Due",
      sortable: true,
      className: "w-[88px]",
      render: (item) => (
        <span
          className={
            isItemOverdue(item)
              ? "text-xs font-semibold text-rose-600 dark:text-rose-400"
              : "text-xs text-muted-foreground"
          }
        >
          {dueLabel(item)}
        </span>
      ),
    });
  }

  if (showVersion) {
    columns.push({
      key: "version",
      header: "Version",
      sortable: true,
      className: "w-[120px]",
      render: (item) =>
        item.version !== undefined ? (
          <span
            className={
              item.revisionReturned
                ? "inline-flex rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400"
                : "inline-flex rounded-lg border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
            }
          >
            v{item.version}
            {item.revisionReturned ? " · Resubmitted" : ""}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    });
  }

  columns.push({
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
              ? "inline-flex justify-center rounded-xl border border-border/80 bg-background/60 px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted shadow-2xs"
              : "inline-flex justify-center rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-xs"
          }
        >
          {action}
        </Link>
      );
    },
  });

  return columns;
}
