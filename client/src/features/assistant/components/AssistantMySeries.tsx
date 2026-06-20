import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { useRole } from "@/shared/lib/role";
import {
  currentUserByRole,
  findSeries,
  seriesMembers,
  tasks,
} from "@/entities";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { ArrowRight, Inbox } from "lucide-react";
import { normalizeStatus, isOpenTask } from "../lib/taskLifecycle";

export function AssistantMySeries() {
  const { role } = useRole();
  const me = currentUserByRole[role];

  const memberships = seriesMembers.filter(
    (m) => m.userId === me.id && m.status === "active",
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="My series"
        jp="参加シリーズ"
        description="Series you're an active member of. You only see your own work — not the full team's tasks."
      />

      {memberships.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-foreground/15 bg-card py-16 text-foreground/55">
          <Inbox className="h-5 w-5" />
          <span className="text-[12px]">You're not on any active series team yet.</span>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {memberships.map((m) => {
            const series = findSeries(m.seriesId);
            if (!series) return null;
            const myTasks = tasks.filter(
              (t) =>
                t.assigneeId === me.id &&
                t.chapterId.startsWith("ch_") &&
                // chapter belongs to this series
                seriesMembers.some(() => true) &&
                tasksMatchSeries(t, series.id),
            );
            const open = myTasks.filter(isOpenTask).length;
            const completed = myTasks.filter(
              (t) => normalizeStatus(t.status) === "editor-approved",
            ).length;
            return (
              <div
                key={m.id}
                className="overflow-hidden rounded-md border border-foreground/10 bg-card"
              >
                <div className="flex gap-3 p-3">
                  <img
                    src={series.cover}
                    alt={series.title}
                    className="h-20 w-14 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-foreground line-clamp-1">
                      {series.title}
                    </div>
                    <div className="font-jp text-[11px] text-foreground/55 line-clamp-1">
                      {series.jp}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StatusBadge status={series.status} />
                      <span className="inline-flex items-center rounded border border-foreground/10 bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/70">
                        Assistant
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-t border-foreground/10 text-center text-[11px]">
                  <div className="border-r border-foreground/10 px-3 py-2">
                    <div className="text-foreground/55">Open</div>
                    <div className="text-[13px] font-semibold text-foreground tabular-nums">
                      {open}
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <div className="text-foreground/55">Completed</div>
                    <div className="text-[13px] font-semibold text-foreground tabular-nums">
                      {completed}
                    </div>
                  </div>
                </div>
                <Link
                  to="/app/assistant/tasks"
                  className="flex items-center justify-between border-t border-foreground/10 bg-background px-3 py-2 text-[12px] font-medium text-foreground hover:bg-muted"
                >
                  View my tasks <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { findChapter } from "@/entities";
function tasksMatchSeries(t: { chapterId: string }, seriesId: string) {
  const ch = findChapter(t.chapterId);
  return ch?.seriesId === seriesId;
}
