import { useMemo } from "react";
import { Coins } from "lucide-react";
import { useAuth } from "@/shared/auth";
import {
  useAssistantEarningsQuery,
  useMyChaptersQuery,
  useMySeriesQuery,
  useStudioTasksQuery,
} from "../../api/assistant-queries";
import type {
  AssistantEarning,
  AssistantEarningItem,
} from "@/entities/submission/model/assistant-types";
import { PageHeader } from "@/shared/ui";
import { StatCard } from "@/shared/ui/stat-card";
import { EmptyState } from "@/shared/ui/empty-state";
import { formatDate } from "@/shared/lib/format-date";

export function EarningsPage() {
  const user = useAuth((s) => s.user);
  const { data: chapters = [] } = useMyChaptersQuery();
  const { data: seriesList = [] } = useMySeriesQuery();
  const { data: tasks = [] } = useStudioTasksQuery({});
  const { data: earnings = [] } = useAssistantEarningsQuery();

  const mine = useMemo(
    () => (user ? earnings.filter((earning) => earning.assistantId === user.id) : []),
    [earnings, user],
  );
  const approvedItems = useMemo(() => mine.flatMap((earning) => earning.items ?? []), [mine]);
  const monthKey = new Date().toISOString().slice(0, 7);
  const totalMonth = useMemo(
    () =>
      mine
        .filter((earning) => getEarningPeriod(earning) === monthKey)
        .reduce((sum, earning) => sum + earning.amount, 0),
    [mine, monthKey],
  );
  const lifetimeTotal = useMemo(
    () => mine.reduce((sum, earning) => sum + earning.amount, 0),
    [mine],
  );
  const approvedItemsThisMonth = useMemo(
    () => approvedItems.filter((item) => (item.period ?? "").startsWith(monthKey)).length,
    [approvedItems, monthKey],
  );
  const currency = mine[0]?.currency ?? approvedItems[0]?.currency ?? "VND";

  if (!user) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Account"
        title="Earnings"
        description="Read-only monthly earnings generated after approved assistant tasks."
      />

      {mine.length === 0 ? (
        <EmptyState
          title="No earnings data yet"
          description="When your task is approved, earnings will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              tone="amber"
              icon={<Coins className="size-4" />}
              label="Approved tasks this month"
              value={String(approvedItemsThisMonth)}
            />
            <StatCard
              tone="violet"
              icon={<Coins className="size-4" />}
              label="This month"
              value={formatCurrency(totalMonth, currency)}
            />
            <StatCard
              tone="emerald"
              icon={<Coins className="size-4" />}
              label="Lifetime total"
              value={formatCurrency(lifetimeTotal, currency)}
            />
          </div>

          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 text-left font-semibold">Month</th>
                  <th className="px-3 py-2 text-left font-semibold">Task</th>
                  <th className="px-3 py-2 text-left font-semibold">Series</th>
                  <th className="px-3 py-2 text-left font-semibold">Ch / Page</th>
                  <th className="px-3 py-2 text-right font-semibold">Amount</th>
                  <th className="px-3 py-2 text-left font-semibold">Approved</th>
                </tr>
              </thead>
              <tbody>
                {approvedItems.map((item) => {
                  const task = tasks.find((candidate) => candidate.id === item.taskId);
                  const chapter = chapters.find(
                    (candidate) => candidate.id === (item.chapterId ?? task?.chapterId),
                  );
                  const series = seriesList.find(
                    (candidate) => candidate.id === (item.seriesId ?? chapter?.seriesId),
                  );
                  const page = chapter?.pages.find((candidate) => candidate.id === task?.pageId);

                  return (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5 font-semibold tabular-nums">
                        {item.period ?? getPeriodFromEarningId(item)}
                      </td>
                      <td className="px-3 py-2.5">{task?.title ?? item.taskType ?? "-"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{series?.title ?? "-"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        Ch.{chapter?.number ?? "-"} / P.
                        {page ? String(page.index).padStart(2, "0") : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                        {formatCurrency(item.amount, item.currency)}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {item.approvedAt ? formatDate(item.approvedAt) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(currency === "VND" ? "vi-VN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getEarningPeriod(earning: Pick<AssistantEarning, "period" | "month">) {
  return earning.period ?? earning.month ?? "unknown";
}

function getPeriodFromEarningId(item: AssistantEarningItem) {
  return item.earningId.split("-").slice(-2).join("-") || "unknown";
}
