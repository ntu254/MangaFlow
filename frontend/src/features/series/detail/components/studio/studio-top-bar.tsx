import { Upload, ArrowLeft, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChapterStatusPill } from "@/entities/chapter";
import { formatDate } from "@/shared/lib/format-date";
import type { Chapter, ChapterPage, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioPermissionSet } from "../../model/studio-permissions";
import { chapterPageLabel } from "@/entities/chapter/model/chapter-pages";
import { ResolvedImage } from "@/shared/ui";

type Props = {
  series: ProductionSeries;
  chapter: Chapter | undefined;
  page: ChapterPage | undefined;
  regionCount: number;
  taskCount: number;
  commentCount: number;
  onUploadPages: () => void;
  onBack?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  permissions: StudioPermissionSet;
  editorReview?: {
    blockingComments: number;
    deadlineLabel: string;
    deadlineTone: "neutral" | "rose" | "amber" | "emerald";
  };
};

export function StudioTopBar({
  series,
  chapter,
  page,
  regionCount,
  taskCount,
  commentCount,
  onUploadPages,
  onBack,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  permissions,
  editorReview,
}: Props) {
  const deadline = chapter?.reviewDueAt ?? chapter?.draftDueAt;

  const undoTooltip = canUndo ? "Undo (Ctrl/Cmd+Z)" : "Nothing to undo";
  const redoTooltip = canRedo ? "Redo (Ctrl/Cmd+Shift+Z)" : "Nothing to redo";

  return (
    <TooltipProvider delayDuration={200}>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-4 py-2.5 sm:gap-4 lg:flex lg:flex-wrap lg:justify-between">
        {/* Left: navigation + series identity */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onBack ? (
            <button
              onClick={onBack}
              className="grid h-8 w-8 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          <ResolvedImage
            fileKey={series.coverFileKey}
            fallbackUrl={series.coverUrl}
            alt=""
            className="h-10 w-8 shrink-0 rounded object-cover ring-1 ring-border"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">{series.title}</p>
            <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
              {chapter
                ? `Chapter ${String(chapter.number).padStart(3, "0")} · ${chapter.title}`
                : "No chapter selected"}
            </p>
            <p className="mt-0.5 truncate text-[10px] font-semibold text-foreground/70">
              {permissions.title}
            </p>
          </div>
        </div>

        {/* Center: chapter/page KPI strip */}
        <div className="hidden flex-1 justify-center lg:flex">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px]">
            <Meta
              label="Page"
              value={page ? `${chapterPageLabel(page)} / ${chapter?.pages.length ?? 0}` : "—"}
            />
            <Meta
              label="Status"
              value={chapter ? <ChapterStatusPill status={chapter.status} /> : "—"}
            />
            <Meta label="Regions" value={regionCount} />
            <Meta label="Tasks" value={taskCount} />
            <Meta label="Comments" value={commentCount} />
            <Meta label="Deadline" value={deadline ? formatDate(deadline) : "—"} />
            {editorReview ? (
              <Meta
                label="Blocking"
                value={
                  <span
                    className={
                      editorReview.blockingComments > 0
                        ? "text-rose-700 dark:text-rose-300"
                        : "text-emerald-700 dark:text-emerald-300"
                    }
                  >
                    {editorReview.blockingComments}
                  </span>
                }
              />
            ) : null}
            {editorReview ? (
              <Meta
                label="Review due"
                value={
                  <span
                    className={
                      editorReview.deadlineTone === "rose"
                        ? "text-rose-700 dark:text-rose-300"
                        : editorReview.deadlineTone === "amber"
                          ? "text-amber-700 dark:text-amber-300"
                          : editorReview.deadlineTone === "emerald"
                            ? "text-emerald-700 dark:text-emerald-300"
                            : undefined
                    }
                  >
                    {editorReview.deadlineLabel}
                  </span>
                }
              />
            ) : null}
          </div>
        </div>

        {/* Right: actions + undo/redo */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {permissions.canUploadPages ? (
            <Button
              variant="outline"
              size="sm"
              disabled={!chapter}
              onClick={onUploadPages}
              className="h-9 gap-1.5"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Page</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          ) : null}
          <div className="ml-1 flex items-center gap-0.5 border-l border-border pl-2 sm:ml-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="grid h-8 w-8 place-items-center rounded text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={canUndo ? "Undo" : "Undo unavailable"}
                >
                  <Undo2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{undoTooltip}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="grid h-8 w-8 place-items-center rounded text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={canRedo ? "Redo" : "Redo unavailable"}
                >
                  <Redo2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{redoTooltip}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </span>
  );
}
