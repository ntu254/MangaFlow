import { Link } from "@tanstack/react-router";
import { findChapter, findSeries, findStaff, type Task } from "@/entities";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { jpy } from "@/shared/lib/format";
import { deadlineClass, deadlineLabel, deadlineTone } from "../lib/deadline";
import { Inbox } from "lucide-react";

export function TaskList({
  tasks,
  showPayout,
  showAssignee,
}: {
  tasks: Task[];
  showPayout: boolean;
  showAssignee: boolean;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-foreground/15 bg-card py-16 text-foreground/55">
        <Inbox className="h-5 w-5" />
        <span className="text-[12px]">No tasks match the current filters.</span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="bg-muted text-[11px] uppercase tracking-wider text-foreground/55">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Series · Chapter</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Pages</th>
              {showAssignee && (
                <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Assignee</th>
              )}
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Deadline</th>
              {showPayout && (
                <th className="hidden px-3 py-2 text-right font-medium md:table-cell">Payout</th>
              )}
              <th className="px-3 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const ch = findChapter(t.chapterId);
              const s = ch ? findSeries(ch.seriesId) : null;
              const assignee = findStaff(t.assigneeId);
              const tone = deadlineTone(t.deadline);
              const firstPageId = `pg_${t.chapterId}_1`;

              return (
                <tr
                  key={t.id}
                  className={`border-t border-foreground/10 transition hover:bg-muted/60 ${
                    tone === "overdue" ? "bg-destructive/5" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">{s?.title ?? "—"}</div>
                    <div className="text-[11px] text-foreground/55">{ch?.number ?? "—"}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded border border-foreground/10 bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/70">
                      {t.type}
                    </span>
                  </td>
                  <td className="hidden px-3 py-2 text-foreground/70 md:table-cell">
                    {t.pageRange}
                  </td>
                  {showAssignee && (
                    <td className="hidden px-3 py-2 text-foreground/70 md:table-cell">
                      {assignee?.name ?? "—"}
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className={`px-3 py-2 ${deadlineClass(tone)}`}>
                    {deadlineLabel(t.deadline, tone)}
                  </td>
                  {showPayout && (
                    <td className="hidden px-3 py-2 text-right tabular-nums text-foreground/70 md:table-cell">
                      {jpy(t.payout)}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right">
                    <Link
                      to="/app/pages/$id/studio"
                      params={{ id: firstPageId }}
                      search={(prev: any) => ({ seriesId: prev?.seriesId })}
                      className="flex h-7 items-center justify-center rounded border border-primary/20 bg-primary/10 px-3 text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
