import { Link } from "@tanstack/react-router";
import { MoreHorizontal, CheckCircle2, Trash2, XCircle } from "lucide-react";
import { Progress } from "@/shared/ui/shadcn/progress";
import { useState } from "react";
import { useDeleteChapter, useArchiveChapter } from "@/shared/queries/useChapterPages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";

export interface ChapterRowProps {
  chapter: any; // Using any for mock data compatibility
  seriesId: string;
  chapterBadgeClass?: Record<string, string>;
  chapterBadgeLabel?: Record<string, string>;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ChapterRow({
  chapter,
  seriesId,
  chapterBadgeClass = {},
  chapterBadgeLabel = {},
  isSelected,
  onClick,
}: ChapterRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const deleteChapter = useDeleteChapter();
  const archiveChapter = useArchiveChapter();

  const [dialogConfig, setDialogConfig] = useState<{
    open: boolean;
    action: "delete" | "cancel" | null;
  }>({
    open: false,
    action: null,
  });

  // Note: For MVP we use basic tasks check. In reality, chapter object would need `tasksCount` returned from summary API.
  // Assuming if progress/active is truthy it might have tasks.
  const hasTasks = Boolean(chapter.active || (chapter.progress && chapter.progress > 0));
  const isDraftOrEarly =
    chapter.status === "DRAFT" || (chapter.status === "IN_PRODUCTION" && !hasTasks);
  const isInProductionWithTasks = chapter.status === "IN_PRODUCTION" && hasTasks;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDialogConfig({ open: true, action: "delete" });
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDialogConfig({ open: true, action: "cancel" });
  };

  return (
    <div
      onClick={onClick}
      className={`grid min-h-[78px] grid-cols-[38px_minmax(0,1fr)] gap-3 px-4 py-3 transition-all sm:grid-cols-[38px_minmax(132px,1fr)_138px_118px_32px] sm:items-center sm:gap-3 cursor-pointer ${
        isSelected
          ? "bg-sky-500/10 ring-1 ring-inset ring-sky-500/70"
          : chapter.active
            ? "bg-sky-500/5 ring-1 ring-inset ring-sky-500/30"
            : "hover:bg-foreground/[0.022]"
      }`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground/8 text-[12px] font-black tabular-nums text-foreground/70">
        {chapter.chapter || chapter.chapterNumber}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <h3 className="truncate text-[12px] font-extrabold text-foreground">
            {chapter.title || `Chapter ${chapter.chapterNumber}`}
          </h3>
          <span
            className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase leading-none tracking-wide ${
              chapterBadgeClass[chapter.status?.toLowerCase()] ??
              "bg-foreground/10 text-foreground/60"
            }`}
          >
            {chapterBadgeLabel[chapter.status?.toLowerCase()] ?? chapter.status}
          </span>
        </div>
        <div className="mt-1 text-[10px] font-semibold text-foreground/50">
          {chapter.cadence || "Weekly"} <span className="px-1 text-foreground/25">-</span>{" "}
          {chapter.updated || "Updated recently"}
        </div>
      </div>

      <div className="col-start-2 min-w-0 sm:col-start-auto">
        <div className="text-[12px] font-extrabold tabular-nums text-foreground/75">
          {chapter.pages || "0 / 20 pages"}
        </div>
        <div className="mt-1 text-[10px] font-semibold text-foreground/45">
          {chapter.active ? (
            <>
              <span>15 tasks</span>
              <span className="px-1 text-foreground/25">-</span>
              <span className="text-amber-600">3 pending</span>
            </>
          ) : (
            chapter.meta || "No tasks yet"
          )}
        </div>
        {chapter.status?.toLowerCase() === "published" ||
        chapter.status?.toLowerCase() === "archived" ? (
          <div className="mt-2 flex h-1.5 items-center justify-end">
            <CheckCircle2
              className={`h-3.5 w-3.5 ${
                chapter.status?.toLowerCase() === "published"
                  ? "text-emerald-500"
                  : "text-slate-400"
              }`}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Progress
              value={chapter.progress || 0}
              className={`mt-2 h-1.5 bg-foreground/10 ${
                (chapter.progress || 0) === 0 ? "[&>div]:bg-foreground/12" : ""
              }`}
            />
            {(chapter.progress || 0) > 0 && (
              <span className="mt-2 w-7 text-right text-[9px] font-extrabold tabular-nums text-foreground/45">
                {chapter.progress}%
              </span>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className={`col-start-2 inline-flex h-8 w-fit items-center justify-center rounded-md px-3 text-[10px] font-extrabold transition-all sm:col-start-auto sm:w-full whitespace-nowrap text-center ${
          chapter.active
            ? "bg-[#061A2B] text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg dark:bg-blue-600"
            : "border border-foreground/12 bg-card text-[#061A2B] shadow-sm hover:bg-foreground/5 dark:text-blue-300"
        }`}
      >
        View Pages
      </button>
      <button className="col-start-2 flex h-8 w-8 items-center justify-center rounded-md border border-foreground/12 bg-card text-foreground/55 shadow-sm hover:bg-foreground/5 sm:col-start-auto">
        <MoreHorizontal className="h-4 w-4" />
      </button>

      <AlertDialog
        open={dialogConfig.open}
        onOpenChange={(open) => setDialogConfig((p) => ({ ...p, open }))}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogConfig.action === "delete" ? "Delete Chapter" : "Archive Chapter"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogConfig.action === "delete"
                ? "Are you sure you want to delete this chapter? This action cannot be undone."
                : "Are you sure you want to archive this chapter?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (dialogConfig.action === "delete") deleteChapter.mutate(chapter.id);
                if (dialogConfig.action === "cancel") archiveChapter.mutate(chapter.id);
              }}
              className={
                dialogConfig.action === "delete"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
