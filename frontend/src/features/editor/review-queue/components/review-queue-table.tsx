import { Link } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import type { ReviewItem } from "../../model/editor-access";
import { formatDate, formatDateTime, isOverdue, timeAgo } from "@/shared/lib/format-date";
import { AUDIENCE_LABEL } from "@/entities/proposal/model/proposal-types";
import { ReviewStatusPill } from "@/entities/submission";
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
  if (isItemCompleted(item)) return false;
  return !item.claimedByEditorId && NEW_REVIEW_STATUSES.has(item.status);
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
  if (!item.claimedByEditorId) return "Claim & Review";
  if (item.claimedByEditorId === currentUserId) return "Continue";
  return "View Dossier";
}

function dueLabel(item: ReviewItem) {
  if (!item.deadline) return "—";
  if (isItemOverdue(item)) return `Overdue`;
  return formatDate(item.deadline);
}

export function reviewRowAccent(item: ReviewItem): QueueAccent {
  if (isItemOverdue(item)) return "rose";
  return null;
}

export function reviewQueueColumns(
  currentUserId: string,
  items: ReviewItem[] = [],
): QueueColumn<ReviewItem>[] {
  const columns: QueueColumn<ReviewItem>[] = [
    {
      key: "item",
      header: "Proposal",
      sortable: true,
      render: (item) => {
        const isProposal = item.kind === "PROPOSAL_PACKAGE";
        const mainTitle = isProposal ? (item.proposalTitle ?? item.title) : item.title;
        const subtitle = isProposal
          ? item.logline || `Includes: ${includesFor(item)}`
          : `${item.seriesTitle ?? "—"} • ${includesFor(item)}`;

        return (
          <div className="flex items-start gap-3 py-0.5">
            <ResolvedImage
              fileKey={item.coverFileKey}
              fallbackUrl={item.coverUrl}
              alt={item.seriesTitle ?? item.title ?? "Cover"}
              className="size-10 shrink-0 rounded-xl border border-border/80 object-cover shadow-2xs"
              fallback={
                <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 font-serif text-sm font-bold text-primary shadow-2xs">
                  {(item.seriesTitle ?? item.title ?? "?").slice(0, 1).toUpperCase()}
                </div>
              }
            />
            <div className="min-w-0 flex-1 space-y-1" title={`ID: ${item.proposalId ?? item.refId}`}>
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <p className="truncate font-semibold text-foreground text-xs sm:text-sm">
                  {mainTitle}
                </p>
                {item.version !== undefined ? (
                  <span
                    className={
                      item.revisionReturned
                        ? "inline-flex shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-400 tabular-nums"
                        : "inline-flex shrink-0 rounded-md border border-border bg-muted/60 px-1.5 py-0.2 text-[9px] font-bold text-muted-foreground tabular-nums"
                    }
                  >
                    v{item.version}.0{item.revisionReturned ? " · Resubmitted" : ""}
                  </span>
                ) : null}
                {isNewReviewItem(item) ? (
                  <span className="shrink-0 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    New
                  </span>
                ) : null}
              </div>
              <p className="truncate text-xs text-muted-foreground font-normal leading-normal max-w-[420px] break-words [overflow-wrap:anywhere]">
                {subtitle}
              </p>
            </div>
          </div>
        );
      },
    },

    {
      key: "audience",
      header: "Audience",
      sortable: true,
      className: "w-[125px]",
      render: (item) =>
        item.targetAudience ? (
          <span className="inline-flex rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
            {AUDIENCE_LABEL[item.targetAudience as keyof typeof AUDIENCE_LABEL] || item.targetAudience}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      key: "genres",
      header: "Genres",
      sortable: true,
      className: "w-[140px]",
      render: (item) =>
        item.genres?.length ? (
          <div className="flex flex-wrap gap-1">
            {item.genres.map((g) => (
              <span
                key={g}
                className="rounded-md bg-muted/80 border border-border/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {g}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
        {
      key: "author",
      header: "Mangaka",
      sortable: true,
      className: "w-[130px]",
      render: (item) => (
        <span className="truncate text-xs font-semibold text-foreground block">
          {item.submittedBy || "Unknown Author"}
        </span>
      ),
    },
    {
      key: "assignment",
      header: "Tantou Editor",
      sortable: true,
      className: "w-[150px]",
      render: (item) => {
        if (!item.claimedByEditorId) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400">
              <UserPlus className="size-3" /> Unclaimed
            </span>
          );
        }
        const isMe = item.claimedByEditorId === currentUserId;
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`grid size-5 place-items-center rounded-full text-[9px] font-bold uppercase ${
                isMe ? "bg-emerald-500/20 text-emerald-600" : "bg-primary/10 text-primary"
              }`}
            >
              {(item.claimedByEditorName || "ED").slice(0, 1)}
            </span>
            <span className="truncate text-xs font-medium text-foreground max-w-[100px]">
              {isMe ? "You" : item.claimedByEditorName}
            </span>
          </div>
        );
      },
    },
    
    {
      key: "status",
      header: "Status & Time",
      sortable: true,
      className: "w-[150px]",
      render: (item) => (
        <div className="space-y-1">
          <ReviewStatusPill status={item.status} />
          <p className="text-[10px] text-muted-foreground" title={formatDateTime(item.submittedAt)}>
            Submitted {timeAgo(item.submittedAt)}
          </p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      className: "w-[130px]",
      render: (item) => {
        const action = actionFor(item, currentUserId);
        const isClaim = action.includes("Claim");
        const isContinue = action.includes("Continue");
        return (
          <Link
            {...linkFor(item)}
            className={
              isClaim || isContinue
                ? "inline-flex justify-center rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-xs"
                : "inline-flex justify-center rounded-xl border border-border/80 bg-background/60 px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted shadow-2xs"
            }
          >
            {action}
          </Link>
        );
      },
    },
  ];

  return columns;
}
