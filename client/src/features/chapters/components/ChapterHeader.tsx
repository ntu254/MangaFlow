import { Link } from "@tanstack/react-router";
import { Upload, Plus } from "lucide-react";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import type { Chapter } from "@/entities";
import type { ChapterPerms } from "../lib/chapterPermissions";

export function ChapterHeader({
  chapter,
  series,
  pageCount,
  perms,
  onCreateTask,
}: {
  chapter: Chapter;
  series: { id: string; title: string; jp?: string };
  pageCount: number;
  perms: ChapterPerms;
  onCreateTask: () => void;
}) {
  return (
    <div className="border-b border-foreground/10 pb-4 mb-4">
      <nav className="text-[11px] text-foreground/55 mb-2">
        <Link to="/app/series" className="hover:text-foreground">
          My Series
        </Link>
        <span className="mx-1.5">/</span>
        <Link to="/app/series/$id" params={{ id: series.id }} className="hover:text-foreground">
          {series.title}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground/80">{chapter.number}</span>
      </nav>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {chapter.number} — {chapter.title}
          </h1>
          {series.jp && <div className="mt-0.5 text-[12px] text-foreground/55">{series.jp}</div>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-foreground/70">
            <StatusBadge status={chapter.status} />
            <span>·</span>
            <span>{pageCount} pages</span>
            {chapter.scheduledAt && (
              <>
                <span>·</span>
                <span>scheduled {chapter.scheduledAt}</span>
              </>
            )}
            {chapter.publishedAt && (
              <>
                <span>·</span>
                <span>published {chapter.publishedAt}</span>
              </>
            )}
          </div>
        </div>

        {perms.canViewFull && (
          <div className="flex items-center gap-2">
            {perms.canUploadPages && (
              <Link
                to="/app/chapters/$id/pages/upload"
                params={{ id: chapter.id }}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-foreground/15 px-3 text-xs font-medium hover:bg-foreground/5"
              >
                <Upload className="h-3.5 w-3.5" /> Upload pages
              </Link>
            )}
            {perms.canCreateTasks && (
              <button
                onClick={onCreateTask}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" /> Create task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
