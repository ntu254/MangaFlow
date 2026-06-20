import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import type { Chapter, Task } from "@/entities";
import { findStaff } from "@/entities";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";

export function AssistantMinimalView({
  chapter,
  myTasks,
}: {
  chapter: Chapter;
  myTasks: Task[];
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">
          {chapter.number} — {chapter.title}
        </h1>
        <div className="mt-1 flex items-center gap-2 text-[12px] text-foreground/55">
          <StatusBadge status={chapter.status} />
          <span>read-only context for your assigned tasks</span>
        </div>
      </div>

      <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
        Your tasks in this chapter
      </h2>
      <ul className="space-y-2">
        {myTasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 rounded border border-foreground/10 bg-card p-3"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-[13px]">
                {t.type} · {t.pageRange}
              </div>
              <div className="text-[11px] text-foreground/55">
                {findStaff(t.assigneeId)?.name} · due {t.deadline}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={t.status} />
              <Link
                to="/app/tasks"
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLink className="h-3 w-3" /> Open Task Studio
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
