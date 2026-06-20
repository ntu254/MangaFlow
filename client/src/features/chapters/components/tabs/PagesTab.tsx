import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { findSeries, type Page, type Task } from "@/entities";
import { taskCoversPage } from "../../lib/taskStatus";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";

export function PagesTab({
  pages,
  selectedId,
  onSelect,
  tasks,
  seriesId,
}: {
  pages: Page[];
  selectedId?: string;
  onSelect: (id: string) => void;
  tasks: Task[];
  seriesId: string;
}) {
  const series = findSeries(seriesId)!;
  const idx = Math.max(0, pages.findIndex((p) => p.id === selectedId));
  const current = pages[idx];
  if (!current)
    return (
      <div className="p-6 text-[13px] text-foreground/55">
        No pages uploaded yet. Upload pages to begin production.
      </div>
    );
  const pageTasks = tasks.filter((t) => taskCoversPage(t, current.order));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-foreground/70">
          Page {current.order} of {pages.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={idx === 0}
            onClick={() => onSelect(pages[idx - 1].id)}
            className="rounded border border-foreground/15 p-1 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            disabled={idx === pages.length - 1}
            onClick={() => onSelect(pages[idx + 1].id)}
            className="rounded border border-foreground/15 p-1 disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <Link
            to="/app/pages/$id/studio"
            params={{ id: current.id }}
            className="inline-flex items-center gap-1 rounded-md border border-foreground/15 px-2 py-1 text-[11px] hover:bg-foreground/5"
          >
            <ExternalLink className="h-3 w-3" /> Open Page Studio
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-md overflow-hidden rounded border border-foreground/10 bg-foreground/5">
        <img
          src={series.cover}
          alt={`Page ${current.order}`}
          className="h-auto w-full object-cover"
        />
      </div>

      <div className="space-y-1">
        <div className="text-[11px] font-medium uppercase tracking-wider text-foreground/55">
          Tasks on this page
        </div>
        {pageTasks.length === 0 ? (
          <div className="text-[12px] text-foreground/55">No tasks cover this page.</div>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {pageTasks.map((t) => (
              <li
                key={t.id}
                className="inline-flex items-center gap-1.5 rounded border border-foreground/10 bg-card px-2 py-1 text-[11px]"
              >
                <span className="font-medium">{t.type}</span>
                <span className="text-foreground/55">{t.pageRange}</span>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
