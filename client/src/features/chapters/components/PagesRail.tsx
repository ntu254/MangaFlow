import { Link } from "@tanstack/react-router";
import { Upload, MoreVertical } from "lucide-react";
import type { Page, Task, Chapter } from "@/entities";
import { PageAssetImage } from "@/shared/ui/PageAssetImage";
import { useState } from "react";
import { chapterHasActiveTask } from "../lib/productionPhase";
import { isTaskActive, taskCoversPage } from "../lib/taskStatus";
import type { ChapterPerms } from "../lib/chapterPermissions";

type Filter = "all" | "with-tasks" | "approved" | "pending";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "with-tasks", label: "With tasks" },
  { id: "approved", label: "Approved" },
  { id: "pending", label: "Pending" },
];

function pageDot(p: Page) {
  if (p.status === "approved") return "bg-emerald-500";
  if (p.status === "under-review") return "bg-amber-500";
  if (p.status === "in-progress" || p.status === "task-assigned") return "bg-sky-500";
  return "bg-foreground/25";
}

export function PagesRail({
  chapter,
  pages,
  tasks,
  perms,
  selectedId,
  onSelect,
}: {
  chapter: Chapter;
  pages: Page[];
  tasks: Task[];
  perms: ChapterPerms;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const chapterLocked = chapterHasActiveTask(tasks);

  const pageHasActive = (p: Page) =>
    tasks.some((t) => isTaskActive(t) && taskCoversPage(t, p.order));

  const visible = pages.filter((p) => {
    if (filter === "with-tasks") return tasks.some((t) => taskCoversPage(t, p.order));
    if (filter === "approved") return p.status === "approved";
    if (filter === "pending") return p.status !== "approved";
    return true;
  });

  return (
    <aside className="rounded-md border border-foreground/10 bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-foreground/55">
          Pages ({pages.length})
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded px-2 py-0.5 text-[10px] ${
              filter === f.id
                ? "bg-foreground/10 text-foreground"
                : "text-foreground/55 hover:bg-foreground/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {visible.map((p) => {
          const active = p.id === selectedId;
          const pageLocked = pageHasActive(p);
          return (
            <div key={p.id} className="relative">
              <button
                onClick={() => onSelect(p.id)}
                className={`group block w-full overflow-hidden rounded border ${
                  active ? "border-primary ring-1 ring-primary" : "border-foreground/10"
                } bg-foreground/5`}
              >
                <div className="relative aspect-[3/4]">
                  <PageAssetImage
                    thumbnailFileAssetId={p.thumbnailFileAssetId}
                    workingFileAssetId={p.workingFileAssetId}
                    originalFileAssetId={p.originalFileAssetId}
                    alt={`Page ${p.order}`}
                    className="h-full w-full"
                    imageClassName="opacity-80"
                  />
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">
                    {p.order}
                  </span>
                  <span
                    className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${pageDot(p)}`}
                  />
                </div>
              </button>
              {perms.canManagePages && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === p.id ? null : p.id);
                  }}
                  className="absolute bottom-1 right-1 rounded bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-3 w-3" />
                </button>
              )}
              {menuOpen === p.id && (
                <div
                  className="absolute right-0 top-full z-10 mt-1 w-44 rounded-md border border-foreground/10 bg-popover p-1 text-[11px] shadow-md"
                  onMouseLeave={() => setMenuOpen(null)}
                >
                  <Link
                    to="/app/pages/$id/studio"
                    params={{ id: p.id }}
                    search={(prev: any) => ({ seriesId: prev?.seriesId })}
                    className="block rounded px-2 py-1 hover:bg-foreground/5"
                  >
                    Open Page Studio
                  </Link>
                  <button
                    disabled={pageLocked}
                    title={
                      pageLocked
                        ? "Delete disabled because this page has active tasks. Cancel or finish the tasks first."
                        : undefined
                    }
                    className="block w-full rounded px-2 py-1 text-left hover:bg-foreground/5 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    Replace page
                  </button>
                  <button
                    disabled={pageLocked}
                    title={
                      pageLocked
                        ? "Delete disabled because this page has active tasks. Cancel or finish the tasks first."
                        : undefined
                    }
                    className="block w-full rounded px-2 py-1 text-left text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    Delete page
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {perms.canManagePages && (
        <div
          className="mt-3 border-t border-foreground/10 pt-3 text-[11px] text-foreground/55"
          title={
            chapterLocked
              ? "Reorder disabled because this chapter already has active tasks."
              : "Drag thumbnails to reorder."
          }
        >
          {chapterLocked
            ? "Reorder locked — chapter has active tasks."
            : "Drag thumbnails to reorder."}
        </div>
      )}

      {perms.canUploadPages && (
        <Link
          to="/app/chapters/$id/pages/upload"
          params={{ id: chapter.id }}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-foreground/20 px-3 py-2 text-[11px] hover:bg-foreground/5"
        >
          <Upload className="h-3.5 w-3.5" /> Upload pages
        </Link>
      )}
    </aside>
  );
}
