import { useMemo, useState } from "react";
import { findStaff, type Task } from "@/entities";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { Plus } from "lucide-react";
import type { ChapterPerms } from "../../lib/chapterPermissions";

export function TasksTab({
  tasks,
  perms,
  onCreate,
}: {
  tasks: Task[];
  perms: ChapterPerms;
  onCreate: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const types = useMemo(() => Array.from(new Set(tasks.map((t) => t.type))), [tasks]);

  const visible = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-7 rounded border border-foreground/15 bg-transparent px-2 text-[11px]"
        >
          <option value="all">All statuses</option>
          <option value="assigned">Assigned</option>
          <option value="in-progress">In progress</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-7 rounded border border-foreground/15 bg-transparent px-2 text-[11px]"
        >
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        {perms.canCreateTasks && (
          <button
            onClick={onCreate}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" /> Create task
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded border border-dashed border-foreground/15 p-6 text-center text-[12px] text-foreground/55">
          No tasks match the current filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-foreground/10">
          <table className="w-full text-[12px]">
            <thead className="bg-foreground/5 text-[11px] uppercase tracking-wider text-foreground/55">
              <tr>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Pages</th>
                <th className="px-3 py-2 text-left">Assignee</th>
                <th className="px-3 py-2 text-left">Deadline</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id} className="border-t border-foreground/10">
                  <td className="px-3 py-2 font-medium">{t.type}</td>
                  <td className="px-3 py-2 text-foreground/70">{t.pageRange}</td>
                  <td className="px-3 py-2 text-foreground/70">
                    {findStaff(t.assigneeId)?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-foreground/70">{t.deadline}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
