import { Check, FileText, PenTool, RefreshCw, Upload, UserCheck } from "lucide-react";
import type { Chapter, ChapterEvent } from "@/entities/series/model/series-types";
import { formatDateTime } from "@/shared/lib/format-date";

type Stage = {
  key: string;
  label: string;
  icon: typeof Check;
  match: (event: ChapterEvent) => boolean;
};

const STAGES: Stage[] = [
  {
    key: "production",
    label: "In Production",
    icon: UserCheck,
    match: (e) => e.toStatus === "IN_PRODUCTION" || e.type === "START_ASSISTANT_WORK",
  },
  {
    key: "editor",
    label: "Tantou Review",
    icon: FileText,
    match: (e) => e.toStatus === "TANTOU_REVIEW" || e.type === "SUBMIT_REVIEW",
  },
  {
    key: "revision",
    label: "Revision",
    icon: PenTool,
    match: (e) => e.toStatus === "REVISION_REQUIRED" || e.type === "REQUEST_REVISION",
  },
  { key: "resubmit", label: "Resubmitted", icon: Upload, match: (e) => e.type === "RESUBMIT" },
  {
    key: "approved",
    label: "Ready",
    icon: Check,
    match: (e) => e.toStatus === "READY_FOR_PUBLICATION" || e.type === "EDITOR_APPROVE",
  },
];

function currentStageIndex(status: Chapter["status"]): number {
  switch (status) {
    case "IN_PRODUCTION":
      return 0;
    case "TANTOU_REVIEW":
      return 1;
    case "REVISION_REQUIRED":
      return 2;
    case "READY_FOR_PUBLICATION":
    case "PUBLISHED":
      return 4;
    default:
      return 1;
  }
}

export function ChapterReviewTimeline({ chapter }: { chapter: Chapter }) {
  const history = chapter.history ?? [];
  const current = currentStageIndex(chapter.status);

  return (
    <div className="flex items-start justify-between gap-2 overflow-x-auto px-2">
      {STAGES.map((stage, index) => {
        // latest matching event for this stage
        const event = [...history].reverse().find(stage.match);
        const done = Boolean(event);
        const isCurrent = index === current;
        const Icon = done ? Check : stage.icon;

        return (
          <div key={stage.key} className="relative flex min-w-[120px] flex-1 flex-col items-center">
            {index < STAGES.length - 1 ? (
              <span
                className={`absolute left-1/2 top-3.5 h-0.5 w-full ${
                  done ? "bg-[var(--admin-ink)]" : "bg-[var(--admin-border)]"
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 flex size-7 items-center justify-center rounded-full border ${
                isCurrent
                  ? "border-[var(--admin-ink)] bg-[var(--admin-ink)] text-[var(--admin-cream)]"
                  : done
                    ? "border-[var(--admin-ink)] bg-[var(--admin-surface)] text-[var(--admin-ink)]"
                    : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-faint)]"
              }`}
            >
              <Icon className="size-3.5" />
            </span>
            <p
              className={`mt-1.5 text-center text-[11px] font-semibold ${
                done || isCurrent ? "text-[var(--admin-ink)]" : "text-[var(--admin-faint)]"
              }`}
            >
              {stage.label}
            </p>
            <p className="text-center text-[10px] text-[var(--admin-muted)]">
              {event ? event.actorName : isCurrent ? "In Progress" : "Pending"}
            </p>
            <p className="text-center text-[10px] text-[var(--admin-faint)]">
              {event ? formatDateTime(event.createdAt) : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
