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
    label: "Draft / Nháp",
    pillClass: "bg-muted text-muted-foreground border-border",
    stage: "Khởi tạo đề xuất",
    nextAction: "Complete proposal and submit / Hoàn thành đề xuất và gửi",
    ctaLabel: "Continue Draft",
  },
  SUBMITTED: {
    label: "Submitted / Đã nộp",
    pillClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50",
    stage: "Đã nộp",
    nextAction: "Waiting for editor assignment / Chờ Editor nhận",
    ctaLabel: "View Status",
  },
  PENDING_EDITOR: {
    label: "Awaiting Editor / Chờ Editor duyệt",
    pillClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
    stage: "Editor duyệt",
    nextAction: "Waiting for editor review / Đang chờ Editor xem xét",
    ctaLabel: "View Status",
  },
  EDITOR_REVIEWING: {
    label: "Editor Reviewing / Editor đang xem xét",
    pillClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
    stage: "Editor đang xem xét",
    nextAction: "Editor is reviewing / Editor đang xem xét",
    ctaLabel: "View Status",
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested / Cần chỉnh sửa",
    pillClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
    stage: "Editor phản hồi",
    nextAction: "Revise proposal and resubmit / Cần sửa đổi đề xuất và nộp lại",
    ctaLabel: "Edit & Resubmit",
  },
  RESUBMITTED: {
    label: "Resubmitted / Đã nộp lại",
    pillClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50",
    stage: "Đã nộp lại",
    nextAction: "Waiting for editor re-review / Chờ Editor xem xét lại",
    ctaLabel: "View Status",
  },
  PENDING_BOARD: {
    label: "Pending Board / Chờ Hội đồng duyệt",
    pillClass:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50",
    stage: "Hội đồng bỏ phiếu",
    nextAction: "Waiting for board decision / Đang chờ Hội đồng bỏ phiếu",
    ctaLabel: "View Status",
  },
  BOARD_VOTING: {
    label: "Board Voting / Hội đồng đang bỏ phiếu",
    pillClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50",
    stage: "Hội đồng đang bỏ phiếu",
    nextAction: "Board members are voting / Hội đồng đang bỏ phiếu",
    ctaLabel: "View Status",
  },
  TIE_BREAK: {
    label: "Tie-break / Cần quyết định EIC",
    pillClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50",
    stage: "Tổng biên tập quyết định",
    nextAction: "Waiting for Editor-in-Chief tie-break / Chờ Tổng biên tập quyết định",
    ctaLabel: "View Status",
  },
  APPROVED: {
    label: "Approved / Đã duyệt",
    pillClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
    stage: "Đã duyệt",
    nextAction: "Proposal approved / Đề xuất đã được duyệt",
    ctaLabel: "View Proposal",
  },
  REJECTED: {
    label: "Rejected / Từ chối",
    pillClass:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
    stage: "Bị từ chối",
    nextAction: "Proposal rejected / Đề xuất bị từ chối",
    ctaLabel: "View Proposal",
  },
  WITHDRAWN: {
    label: "Withdrawn / Đã rút",
    pillClass:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900/50",
    stage: "Đã rút đề xuất",
    nextAction: "Proposal withdrawn / Đề xuất đã bị rút",
    ctaLabel: "View Proposal",
  },
  ARCHIVED: {
    label: "Archived / Đã lưu trữ",
    pillClass:
      "bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-950/30 dark:text-stone-400 dark:border-stone-900/50",
    stage: "Đã lưu trữ",
    nextAction: "Proposal archived / Đề xuất đã lưu trữ",
    ctaLabel: "View Proposal",
  },
};

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "vừa xong";
  if (d < 3600) return `${Math.floor(d / 60)} phút trước`;
  if (d < 86400) return `${Math.floor(d / 3600)} giờ trước`;
  return `${Math.floor(d / 86400)} ngày trước`;
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
            {proposal.synopsis || "Chưa có tóm tắt nội dung."}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="size-3" />
              Manuscript: {pageCountText}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Cập nhật: {timeAgo(proposal.updatedAt)}
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
