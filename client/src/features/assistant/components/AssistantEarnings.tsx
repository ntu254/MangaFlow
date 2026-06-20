import { useMemo, useState } from "react";
import { PageHeader, StatCard } from "@/layouts/AppShell";
import { useRole } from "@/shared/lib/role";
import {
  currentUserByRole,
  findChapter,
  findSeries,
  findTask,
} from "@/entities";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { jpy } from "@/shared/lib/format";
import { earningsBy, EARNING_STATUSES, totalsBy } from "../lib/earnings";
import type { AssistantEarningStatus } from "@/entities";
import { Inbox } from "lucide-react";

export function AssistantEarnings() {
  const { role } = useRole();
  const me = currentUserByRole[role];
  const list = useMemo(() => earningsBy(me.id), [me.id]);
  const totals = totalsBy(me.id);

  const [tab, setTab] = useState<AssistantEarningStatus | "all">("all");
  const filtered = tab === "all" ? list : list.filter((e) => e.status === tab);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Earnings"
        jp="報酬"
        description="Earnings are calculated only after Editor final approval. Payment is processed outside the app."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="This month" value={jpy(totals.thisMonth)} />
        <StatCard label="Pending confirmation" value={jpy(totals.pending)} />
        <StatCard label="Confirmed (unpaid)" value={jpy(totals.confirmed)} />
        <StatCard label="Paid" value={jpy(totals.paid)} />
        <StatCard label="YTD" value={jpy(totals.ytd)} />
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-foreground/10 pb-2">
        <TabButton active={tab === "all"} onClick={() => setTab("all")} label="All" count={list.length} />
        {EARNING_STATUSES.map((s) => (
          <TabButton
            key={s}
            active={tab === s}
            onClick={() => setTab(s)}
            label={s[0].toUpperCase() + s.slice(1)}
            count={list.filter((e) => e.status === s).length}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-foreground/15 bg-card py-16 text-foreground/55">
          <Inbox className="h-5 w-5" />
          <span className="text-[12px]">No earnings in this view.</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-muted text-[11px] uppercase tracking-wider text-foreground/55">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Task</th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Series / Chapter</th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Approved</th>
                  <th className="hidden px-3 py-2 text-right font-medium md:table-cell">Rate</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Paid at</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const task = findTask(e.taskId);
                  const ch = task ? findChapter(task.chapterId) : null;
                  const series = ch ? findSeries(ch.seriesId) : null;
                  return (
                    <tr key={e.id} className="border-t border-foreground/10 hover:bg-muted/60">
                      <td className="px-3 py-2">
                        <div className="font-medium text-foreground line-clamp-1">
                          {task?.title ?? task?.type ?? "Task"}
                        </div>
                        <div className="text-[11px] text-foreground/55">{task?.pageRange ?? "—"}</div>
                      </td>
                      <td className="hidden px-3 py-2 text-foreground/70 md:table-cell">
                        {series?.title ?? "—"} · {ch?.number ?? "—"}
                      </td>
                      <td className="hidden px-3 py-2 text-foreground/70 md:table-cell">{e.approvedAt}</td>
                      <td className="hidden px-3 py-2 text-right tabular-nums text-foreground/55 md:table-cell">
                        {jpy(e.rateSnapshot)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums text-foreground">
                        {jpy(e.amount)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="hidden px-3 py-2 text-foreground/70 md:table-cell">
                        {e.paidAt ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[11px] text-foreground/55">
        Payments are processed outside the app. Status reflects Admin / Finance updates.
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/70 hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
      <span
        className={`inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] tabular-nums ${
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground/60"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
