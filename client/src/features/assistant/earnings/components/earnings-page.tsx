import { useMemo } from "react";
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
    () => (user ? earnings.filter((e) => e.assistantId === user.id) : []),
    [earnings, user],
  );
  const monthKey = new Date().toISOString().slice(0, 7);
  const totalMonth = useMemo(
    () => mine.filter((e) => getEarningPeriod(e) === monthKey).reduce((a, b) => a + b.amount, 0),
    [mine, monthKey],
  );
  const sum = (s: EarningStatus) =>
    mine.filter((e) => getEarningStatus(e) === s).reduce((a, b) => a + b.amount, 0);

  if (!user) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Account"
        title="Earnings"
        description="Read-only. Admin sẽ confirm và mark paid."
      />

      {mine.length === 0 ? (
        <EmptyState
          title="Chưa có dữ liệu thu nhập"
          description="Khi task của bạn được duyệt, earning sẽ hiển thị tại đây."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              tone="amber"
              icon={<Coins className="size-4" />}
              label="Pending"
              value={formatYen(sum("PENDING"))}
            />
            <StatCard
              tone="blue"
              icon={<Coins className="size-4" />}
              label="Confirmed"
              value={formatYen(sum("CONFIRMED"))}
            />
            <StatCard
              tone="emerald"
              icon={<Coins className="size-4" />}
              label="Paid"
              value={formatYen(sum("PAID"))}
            />
            <StatCard
              tone="neutral"
              icon={<Coins className="size-4" />}
              label="Void"
              value={formatYen(sum("VOID"))}
            />
            <StatCard
              tone="violet"
              icon={<Coins className="size-4" />}
              label="Tháng này"
              value={formatYen(totalMonth)}
            />
          </div>

          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 text-left font-semibold">Tháng</th>
                  <th className="px-3 py-2 text-left font-semibold">Task</th>
                  <th className="px-3 py-2 text-left font-semibold">Series</th>
                  <th className="px-3 py-2 text-left font-semibold">Ch / Page</th>
                  <th className="px-3 py-2 text-right font-semibold">Amount</th>
                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                  <th className="px-3 py-2 text-left font-semibold">Approved</th>
                  <th className="px-3 py-2 text-left font-semibold">Paid</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((e) => {
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
                      <td className="px-3 py-2.5">{t?.title ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s?.title ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        Ch.{c?.number ?? "—"} / P.{String(p?.index ?? 0).padStart(2, "0")}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                        {formatYen(e.amount)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${EARNING_STATUS_BADGE[status]}`}
                        >
                          {EARNING_STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {e.approvedAt ? formatDate(e.approvedAt) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {e.paidAt ? formatDate(e.paidAt) : "—"}
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

function formatYen(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

function getEarningPeriod(earning: { period?: string; month?: string }) {
  return earning.period ?? earning.month ?? "unknown";
}

function getEarningStatus(earning: { status?: string }): EarningStatus {
  return earning.status === "VOIDED" ? "VOID" : (earning.status as EarningStatus);
}
