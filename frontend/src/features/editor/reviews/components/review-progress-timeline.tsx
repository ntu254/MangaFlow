import { useState } from "react";
import { Check, ChevronDown, ChevronUp, FileText, PenTool, Upload, UserCheck } from "lucide-react";
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
    label: "Production",
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
  const [expanded, setExpanded] = useState(false);
  const history = chapter.history ?? [];
  const current = currentStageIndex(chapter.status);
  const currentStage = STAGES[current] ?? STAGES[0];

  return (
    <div className="space-y-2">
      {/* Compact Micro-Bar Header (Always Visible, Only ~32px Height) */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider shrink-0">
            Timeline:
          </span>
          <span className="font-bold text-foreground truncate">
            Step {current + 1} of {STAGES.length} — {currentStage.label}
          </span>
        </div>

        {/* Micro Horizontal Dot Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {STAGES.map((s, idx) => {
            const event = [...history].reverse().find(s.match);
            const done = Boolean(event);
            const isCurrent = idx === current;

            return (
              <div key={s.key} className="flex items-center gap-1.5">
                <span
                  title={s.label}
                  className={`size-2.5 rounded-full transition-all ${
                    isCurrent
                      ? "bg-primary ring-2 ring-primary/40 scale-110"
                      : done
                        ? "bg-emerald-500"
                        : "bg-border/80"
                  }`}
                />
                {idx < STAGES.length - 1 && (
                  <span
                    className={`h-[2px] w-4 ${
                      done ? "bg-emerald-500/60" : "bg-border/60"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Expand / Collapse Toggle Button */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          {expanded ? "Hide Details" : "Show Details"}
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
        </button>
      </div>

      {/* Detailed Stepper View (Only Visible when Expanded) */}
      {expanded && (
        <div className="flex items-start justify-between gap-2 overflow-x-auto pt-2 border-t border-border/40">
          {STAGES.map((stage, index) => {
            const event = [...history].reverse().find(stage.match);
            const done = Boolean(event);
            const isCurrent = index === current;
            const Icon = done ? Check : stage.icon;

            return (
              <div key={stage.key} className="relative flex min-w-[110px] flex-1 flex-col items-center">
                {index < STAGES.length - 1 ? (
                  <span
                    className={`absolute left-1/2 top-3 h-0.5 w-full ${
                      done ? "bg-emerald-500" : "bg-border/60"
                    }`}
                  />
                ) : null}
                <span
                  className={`relative z-10 flex size-6 items-center justify-center rounded-full border transition-all ${
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-2xs"
                      : done
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "border-border/80 bg-card text-muted-foreground"
                  }`}
                >
                  <Icon className="size-3" />
                </span>
                <p
                  className={`mt-1 text-center text-[11px] font-bold ${
                    done || isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-center text-[10px] text-muted-foreground font-medium">
                  {event ? event.actorName : isCurrent ? "In Progress" : "Pending"}
                </p>
                <p className="text-center text-[9px] text-muted-foreground">
                  {event ? formatDateTime(event.createdAt) : "—"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
