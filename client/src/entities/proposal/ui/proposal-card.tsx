import { Link } from "@tanstack/react-router";
import { Calendar, FileText, CheckCircle2, Clock } from "lucide-react";
import type { SeriesProposal, ProposalStatus } from "@/entities/proposal/model/proposal-types";
import { ResolvedImage } from "@/shared/ui";

const STATUS_CONFIG: Record<
  ProposalStatus,
  {
    label: string;
    pillClass: string;
    stage: string;
    nextAction: string;
    ctaLabel: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    pillClass: "bg-muted text-muted-foreground border-border",
    stage: "Proposal setup",
    nextAction: "Complete proposal and submit / Complete and submit the proposal",
    ctaLabel: "Continue Draft",
  },
  SUBMITTED: {
    label: "Submitted",
    pillClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50",
    stage: "Submitted",
    nextAction: "Waiting for editor assignment / Waiting for Editor claim",
    ctaLabel: "View Status",
  },
  PENDING_EDITOR: {
    label: "Awaiting Editor",
    pillClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
    stage: "Editor review",
    nextAction: "Waiting for editor review / Waiting for Editor review",
    ctaLabel: "View Status",
  },
  EDITOR_REVIEWING: {
    label: "Editor Reviewing",
    pillClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
    stage: "Editor is reviewing",
    nextAction: "Editor is reviewing / Editor is reviewing",
    ctaLabel: "View Status",
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    pillClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
    stage: "Editor feedback",
    nextAction: "Revise proposal and resubmit / Revise and resubmit the proposal",
    ctaLabel: "Edit & Resubmit",
  },
  RESUBMITTED: {
    label: "Resubmitted",
    pillClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50",
    stage: "Resubmitted",
    nextAction: "Waiting for editor re-review / Waiting for Editor re-review",
    ctaLabel: "View Status",
  },
  PENDING_BOARD: {
    label: "Pending Board",
    pillClass:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50",
    stage: "Board voting",
    nextAction: "Waiting for board decision / Pending Board voting",
    ctaLabel: "View Status",
  },
  BOARD_VOTING: {
    label: "Board Voting",
    pillClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50",
    stage: "Board voting",
    nextAction: "Board members are voting / Board voting",
    ctaLabel: "View Status",
  },
  TIE_BREAK: {
    label: "Tie-break",
    pillClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50",
    stage: "Editor-in-chief decision",
    nextAction: "Waiting for Editor-in-Chief tie-break / Waiting for Editor-in-chief decision",
    ctaLabel: "View Status",
  },
  APPROVED: {
    label: "Approved",
    pillClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
    stage: "Approved",
    nextAction: "Proposal approved / Proposal approved",
    ctaLabel: "View Proposal",
  },
  REJECTED: {
    label: "Rejected",
    pillClass:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
    stage: "Rejected",
    nextAction: "Proposal rejected / Proposal rejected",
    ctaLabel: "View Proposal",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    pillClass:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900/50",
    stage: "Proposal withdrawn",
    nextAction: "Proposal withdrawn / Proposal withdrawn",
    ctaLabel: "View Proposal",
  },
  ARCHIVED: {
    label: "Archived",
    pillClass:
      "bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-950/30 dark:text-stone-400 dark:border-stone-900/50",
    stage: "Archived",
    nextAction: "Proposal archived / Proposal archived",
    ctaLabel: "View Proposal",
  },
};

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)} minutes ago`;
  if (d < 86400) return `${Math.floor(d / 3600)} hours ago`;
  return `${Math.floor(d / 86400)} days ago`;
}

function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function ProposalCard({ proposal }: { proposal: SeriesProposal }) {
  const cfg = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.DRAFT;

  const latestManuscript = proposal.manuscripts?.[proposal.manuscripts.length - 1];
  const pageCountText = latestManuscript?.pageCount
    ? `${latestManuscript.pageCount} sample pages`
    : proposal.materials?.length
      ? `${proposal.materials.length} sample pages`
      : "1 manuscript file";

  // Check if we need the edit query param
  const isEdit = proposal.status === "DRAFT" || proposal.status === "CHANGES_REQUESTED";

  return (
    <div className="group flex flex-col rounded-md border border-border bg-card transition hover:border-foreground/40">
      <Link
        to="/app/submissions/$id"
        params={{ id: proposal.id }}
        search={isEdit ? { edit: 1 } : undefined}
        className="flex gap-4 p-4 flex-1"
      >
        <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded ring-1 ring-border">
          {proposal.coverUrl || proposal.coverFileKey ? (
            <ResolvedImage
              fileKey={proposal.coverFileKey}
              fallbackUrl={proposal.coverUrl}
              alt={proposal.title}
              className="size-full object-cover"
              fallback={
                <div className="grid size-full place-items-center bg-muted font-serif text-lg font-bold text-muted-foreground">
                  {getInitials(proposal.title)}
                </div>
              }
            />
          ) : (
            <div className="grid size-full place-items-center bg-muted font-serif text-lg font-bold text-muted-foreground">
              {getInitials(proposal.title)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-serif text-lg group-hover:underline">{proposal.title}</h3>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${cfg.pillClass}`}
            >
              {cfg.label}
            </span>
          </div>

          <p className="line-clamp-1 text-xs text-muted-foreground">
            {proposal.synopsis || "No synopsis yet."}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="size-3" />
              Manuscript: {pageCountText}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Updated: {timeAgo(proposal.updatedAt)}
            </span>
          </div>

          <div className="mt-2 space-y-1 rounded border border-border/40 bg-muted/20 p-2 text-[11px]">
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-muted-foreground">Review Stage:</span>
              <span className="font-medium text-foreground">{cfg.stage}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-muted-foreground">Next Action:</span>
              <span className="font-medium text-foreground">{cfg.nextAction}</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="border-t border-border px-4 py-2 flex justify-start">
        <Link
          to="/app/submissions/$id"
          params={{ id: proposal.id }}
          search={isEdit ? { edit: 1 } : undefined}
          className="rounded-md bg-foreground px-3 py-1 text-[11px] font-semibold text-background hover:opacity-90 transition-opacity"
        >
          {cfg.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
