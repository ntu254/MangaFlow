import { useMemo, useState } from "react";
import { Coins } from "lucide-react";
import { useAuth } from "@/shared/auth";
import {
  useAssistantEarningsQuery,
  useMyChaptersQuery,
  useMySeriesQuery,
  useStudioTasksQuery,
} from "../../api/assistant-queries";
import {
  EARNING_STATUS_BADGE,
  EARNING_STATUS_LABEL,
  type EarningStatus,
} from "@/entities/submission/model/assistant-types";
import { PageHeader, FilterSelect, SortableHeader } from "@/shared/ui";
import { SelectItem } from "@/components/ui/select";
import { StatCard } from "@/shared/ui/stat-card";
import { EmptyState } from "@/shared/ui/empty-state";
import { formatDate } from "@/shared/lib/format-date";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import { EarningDetailModal } from "./earning-detail-modal";

export function EarningsPage() {
  const user = useAuth((s) => s.user);
  const { data: chapters = [] } = useMyChaptersQuery();
  const { data: seriesList = [] } = useMySeriesQuery();
  const { data: tasks = [] } = useStudioTasksQuery({});
  const { data: earnings = [] } = useAssistantEarningsQuery();

  const mine = useMemo(
    () => (user ? earnings.filter((e) => e.assistantId === user.id) : []),
    [earnings, user],
  );
  const monthKey = new Date().toISOString().slice(0, 7);
  const totalMonth = useMemo(
    () => mine.filter((e) => getEarningPeriod(e) === monthKey),
    [mine, monthKey],
  );
  const totalsFor = (...statuses: EarningStatus[]) =>
    formatMoneyTotals(mine.filter((earning) => statuses.includes(getEarningStatus(earning))));

  const [statusFilter, setStatusFilter] = useState<"ALL" | EarningStatus>("ALL");
  const [periodFilter, setPeriodFilter] = useState("ALL");
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailEarning = mine.find((earning) => earning.id === detailId);
  const detailTask = tasks.find((task) => task.id === detailEarning?.taskId);
  const detailChapter = chapters.find(
    (chapter) => chapter.id === (detailEarning?.chapterId ?? detailTask?.chapterId),
  );
  const detailSeries = seriesList.find(
    (series) => series.id === (detailEarning?.seriesId ?? detailChapter?.seriesId),
  );

  const periods = useMemo(() => Array.from(new Set(mine.map((e) => getEarningPeriod(e)))), [mine]);

  const filtered = useMemo(
    () =>
      mine
        .filter((e) => statusFilter === "ALL" || getEarningStatus(e) === statusFilter)
        .filter((e) => periodFilter === "ALL" || getEarningPeriod(e) === periodFilter),
    [mine, statusFilter, periodFilter],
  );

  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(
    filtered,
    {
      period: (e) => getEarningPeriod(e),
      amount: (e) => e.amount,
      status: (e) => getEarningStatus(e),
    },
    { key: "period", direction: "desc" },
  );

  if (!user) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Account"
        title="Earnings"
        description="Read-only earnings created when Mangaka approves your current submission."
      />

      {mine.length === 0 ? (
        <EmptyState
          title="No earnings data yet"
          description="When your task is approved, the earning will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              tone="amber"
              icon={<Coins className="size-4" />}
              label="Earned"
              value={totalsFor("EARNED", "PENDING")}
            />
            <StatCard
              tone="blue"
              icon={<Coins className="size-4" />}
              label="Adjusted"
              value={totalsFor("ADJUSTED")}
            />
            <StatCard
              tone="emerald"
              icon={<Coins className="size-4" />}
              label="Legacy confirmed"
              value={totalsFor("CONFIRMED")}
            />
            <StatCard
              tone="neutral"
              icon={<Coins className="size-4" />}
              label="Reversed"
              value={totalsFor("REVERSED", "VOID")}
            />
            <StatCard
              tone="violet"
              icon={<Coins className="size-4" />}
              label="This month"
              value={formatMoneyTotals(totalMonth)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "ALL" | EarningStatus)}
            >
              <SelectItem value="ALL">All statuses</SelectItem>
              {(Object.keys(EARNING_STATUS_LABEL) as EarningStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {EARNING_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </FilterSelect>
            <FilterSelect value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectItem value="ALL">All months</SelectItem>
              {periods.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </FilterSelect>
          </div>

          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 text-left font-semibold">
                    <SortableHeader
                      label="Month"
                      sortKey="period"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">Task</th>
                  <th className="px-3 py-2 text-left font-semibold">Series</th>
                  <th className="px-3 py-2 text-left font-semibold">Ch / Page</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    <SortableHeader
                      label="Amount"
                      sortKey="amount"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    <SortableHeader
                      label="Status"
                      sortKey="status"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">Approved</th>
                  <th className="px-3 py-2 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((e) => {
                  const status = getEarningStatus(e);
                  const t = tasks.find((tt) => tt.id === e.taskId);
                  const c = chapters.find((cc) => cc.id === t?.chapterId);
                  const s = seriesList.find((ss) => ss.id === c?.seriesId);
                  const p = c?.pages.find((pp) => pp.id === t?.pageId);
                  return (
                    <tr key={e.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5 font-semibold tabular-nums">
                        {getEarningPeriod(e)}
                      </td>
                      <td className="px-3 py-2.5">{t?.title ?? "-"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s?.title ?? "-"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        Ch.{c?.number ?? "-"} / P.{String(p?.index ?? 0).padStart(2, "0")}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                        {formatMoney(e.amount, e.currency)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${EARNING_STATUS_BADGE[status]}`}
                        >
                          {EARNING_STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {e.approvedAt ? formatDate(e.approvedAt) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setDetailId(e.id)}
                          className="rounded border border-border bg-background px-2 py-1 text-[10px] font-semibold hover:bg-muted"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <EarningDetailModal
        earning={detailEarning}
        task={detailTask}
        chapter={detailChapter}
        series={detailSeries}
        open={!!detailEarning}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </div>
  );
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "VND",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatMoneyTotals(earnings: { amount: number; currency: string }[]) {
  if (earnings.length === 0) return "—";
  const totals = new Map<string, number>();
  for (const earning of earnings) {
    const currency = earning.currency || "VND";
    totals.set(currency, (totals.get(currency) ?? 0) + earning.amount);
  }
  return [...totals.entries()]
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(" + ");
}

function getEarningPeriod(earning: { period?: string; month?: string }) {
  return earning.period ?? earning.month ?? "unknown";
}

function getEarningStatus(earning: { status?: string }): EarningStatus {
  if (earning.status === "VOIDED") return "VOID";
  if (!earning.status) return "EARNED";
  return earning.status as EarningStatus;
}
