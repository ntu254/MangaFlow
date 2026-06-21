import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function RecentChaptersList({ data }: { data?: any }) {
  const recentChapters = data?.recentActivity || [];

  return (
    <div className="flex-1 rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-foreground">Recent Chapters</h2>
        <Link
          to="/app/series"
          className="flex items-center gap-1 text-[12px] font-medium text-foreground/60 hover:text-foreground"
        >
          View all chapters <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-4">
        {recentChapters.slice(0, 4).map((ch: any, i: number) => {
          const isCompleted = ch.status === "COMPLETED" || ch.status === "READY_FOR_PUBLICATION";
          const statusLabel = isCompleted ? "COMPLETED" : "IN PRODUCTION";
          const statusColor = isCompleted
            ? "text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400"
            : "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400";

          const pagesLabel = isCompleted ? "Completed" : "Active";

          return (
            <div key={ch.id} className="flex gap-3 group">
              <div className="h-10 w-14 rounded object-cover border border-foreground/10 bg-foreground/5 flex items-center justify-center text-xs text-foreground/30 font-semibold uppercase">
                Ch.
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate text-[13px] font-medium text-foreground">
                    <span className="font-bold">{ch.seriesTitle || `Series`}</span> - Chapter{" "}
                    {ch.number}
                  </div>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="text-[12px] text-foreground/60 truncate mt-0.5">{pagesLabel}</div>
                <div className="mt-0.5 text-right text-[11px] text-foreground/40">
                  Updated {new Date(ch.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
        {recentChapters.length === 0 && (
          <div className="text-[13px] text-foreground/50 py-4 text-center">
            No recent chapters in production.
          </div>
        )}
      </div>
    </div>
  );
}
