import { MoreHorizontal } from "lucide-react";
import { OpenTaskStudioAction } from "./open-task-studio-action";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioTask } from "@/entities/series/model/studio-types";
import { REGION_TYPE_LABEL } from "@/entities/series/model/studio-types";
import { formatDate } from "@/shared/lib/format-date";
import {
  getTaskEdgeSummary,
  getTaskStatusLabel,
  getVisualTaskStatus,
  getVisualTaskStatusClass,
} from "@/entities/task";
import { buildTaskContext, deadlineRisk, priorityBadge, priorityLabel } from "@/entities/task";

export function AssistantTaskTable({
  tasks,
  chapters,
  seriesList,
  onSelect,
}: {
  tasks: StudioTask[];
  chapters: Chapter[];
  seriesList: ProductionSeries[];
  onSelect: (taskId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--admin-border)] font-serif text-[13px] text-[var(--admin-ink)]">
            <th className="px-4 py-3 text-left font-semibold">Task</th>
            <th className="px-3 py-3 text-left font-semibold">Series</th>
            <th className="px-3 py-3 text-left font-semibold">Chapter / Page</th>
            <th className="px-3 py-3 text-left font-semibold">Region</th>
            <th className="px-3 py-3 text-left font-semibold">Type</th>
            <th className="px-3 py-3 text-left font-semibold">Status</th>
            <th className="px-3 py-3 text-left font-semibold">Due</th>
            <th className="px-3 py-3 text-left font-semibold">Priority</th>
            <th className="px-4 py-3 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const ctx = buildTaskContext(t, chapters, seriesList);
            const risk = deadlineRisk(t.dueAt);
            const visualStatus = getVisualTaskStatus(t);
            const edgeSummary = getTaskEdgeSummary(t);
            return (
              <tr
                key={t.id}
                onClick={() => onSelect(t.id)}
                className="cursor-pointer border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover)]"
              >
                <td className="px-4 py-3">
                  <p className="truncate font-semibold text-[var(--admin-ink)]">{t.title}</p>
                  <p className="truncate text-[11px] text-[var(--admin-faint)]">
                    {ctx.series?.title ?? "—"}
                  </p>
                  {edgeSummary ? (
                    <p className="mt-0.5 truncate text-[10px] text-accent">{edgeSummary}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-[var(--admin-muted)]">{ctx.series?.title ?? "—"}</td>
                <td className="px-3 py-3 text-[var(--admin-muted)]">
                  Ch.{ctx.chapter?.number ?? "—"} / P.{String(ctx.pageIndex ?? 0).padStart(2, "0")}
                </td>
                <td className="px-3 py-3 text-[var(--admin-muted)]">{REGION_TYPE_LABEL[t.type]}</td>
                <td className="px-3 py-3 text-[var(--admin-muted)]">{REGION_TYPE_LABEL[t.type]}</td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getVisualTaskStatusClass(visualStatus)}`}
                  >
                    {getTaskStatusLabel(visualStatus)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col">
                    <span className="tabular-nums">{formatDate(t.dueAt)}</span>
                    <span
                      className={`text-[10px] font-semibold ${
                        risk.tone === "rose"
                          ? "text-rose-600"
                          : risk.tone === "amber"
                            ? "text-amber-700"
                            : "text-emerald-700"
                      }`}
                    >
                      {risk.label}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityBadge(t.priority)}`}
                  >
                    {priorityLabel(t.priority)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <OpenTaskStudioAction
                      task={t}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-[5px] bg-[var(--admin-navy)] px-2 py-1 text-[10px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)] disabled:opacity-60"
                    >
                      Open
                    </OpenTaskStudioAction>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(t.id);
                      }}
                      className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Details"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
