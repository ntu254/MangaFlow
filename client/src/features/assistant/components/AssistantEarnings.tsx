import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard } from "@/layouts/AppShell";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { payrollMoney } from "@/shared/lib/format";
import { payrollApi, type PayrollEarning } from "@/shared/api/payroll";
import { extractErrorMessage } from "@/shared/api/_client";
import { EARNING_STATUSES } from "../lib/earnings";
import type { AssistantEarningStatus } from "@/entities";
import { Inbox, Loader2 } from "lucide-react";

type AssistantEarningRow = {
  id: string;
  taskId: string;
  taskTitle: string;
  seriesTitle: string;
  chapterLabel: string;
  amount: number;
  rateSnapshot: number;
  currency: string;
  status: AssistantEarningStatus;
  approvedAt: string;
  paidAt?: string;
};

export function AssistantEarnings() {
  const {
    data: earnings = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["assistant", "earnings"],
    queryFn: payrollApi.listEarnings,
  });

  const [tab, setTab] = useState<AssistantEarningStatus | "all">("all");
  const list = useMemo(() => earnings.map(toAssistantEarningRow), [earnings]);
  const totals = useMemo(() => calculateTotals(list), [list]);
  const totalsCurrency = list[0]?.currency ?? "VND";
  const filtered = tab === "all" ? list : list.filter((e) => e.status === tab);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Earnings"
        jp="報酬"
        description="Earnings are calculated only after Editor final approval. Payment is processed outside the app."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="This month" value={payrollMoney(totals.thisMonth, totalsCurrency)} />
        <StatCard
          label="Pending confirmation"
          value={payrollMoney(totals.pending, totalsCurrency)}
        />
        <StatCard
          label="Confirmed (unpaid)"
          value={payrollMoney(totals.confirmed, totalsCurrency)}
        />
        <StatCard label="Paid" value={payrollMoney(totals.paid, totalsCurrency)} />
        <StatCard label="YTD" value={payrollMoney(totals.ytd, totalsCurrency)} />
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-foreground/10 pb-2">
        <TabButton
          active={tab === "all"}
          onClick={() => setTab("all")}
          label="All"
          count={list.length}
        />
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

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
          {extractErrorMessage(error)}
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center rounded-md border border-dashed border-foreground/15 bg-card py-16 text-[12px] text-foreground/55">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading earnings...
        </div>
      ) : filtered.length === 0 ? (
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
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
                    Series / Chapter
                  </th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Approved</th>
                  <th className="hidden px-3 py-2 text-right font-medium md:table-cell">Rate</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Paid at</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-foreground/10 hover:bg-muted/60">
                    <td className="px-3 py-2">
                      <div className="font-medium text-foreground line-clamp-1">{e.taskTitle}</div>
                      <div className="text-[11px] text-foreground/55">{e.taskId}</div>
                    </td>
                    <td className="hidden px-3 py-2 text-foreground/70 md:table-cell">
                      {e.seriesTitle} · {e.chapterLabel}
                    </td>
                    <td className="hidden px-3 py-2 text-foreground/70 md:table-cell">
                      {e.approvedAt}
                    </td>
                    <td className="hidden px-3 py-2 text-right tabular-nums text-foreground/55 md:table-cell">
                      {payrollMoney(e.rateSnapshot, e.currency)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums text-foreground">
                      {payrollMoney(e.amount, e.currency)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="hidden px-3 py-2 text-foreground/70 md:table-cell">
                      {e.paidAt ?? "—"}
                    </td>
                  </tr>
                ))}
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
          active
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-foreground/60"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function toAssistantEarningRow(earning: PayrollEarning): AssistantEarningRow {
  return {
    id: earning.id || earning._id || getRefId(earning.taskId) || "earning",
    taskId: getRefId(earning.taskId) || "Unknown task",
    taskTitle: getRefLabel(earning.taskId, "Task"),
    seriesTitle: getRefLabel(earning.seriesId, "Series"),
    chapterLabel: getRefLabel(earning.chapterId, "Chapter"),
    amount: Number(earning.amount ?? 0),
    rateSnapshot: Number(earning.rateSnapshot ?? earning.baseRate ?? 0),
    currency: earning.currency ?? "VND",
    status: normalizeEarningStatus(earning.status),
    approvedAt: formatDate(earning.calculatedAt ?? earning.createdAt),
    paidAt: earning.paidAt ? formatDate(earning.paidAt) : undefined,
  };
}

function normalizeEarningStatus(status: PayrollEarning["status"]): AssistantEarningStatus {
  const normalized = String(status).toUpperCase();
  if (normalized === "CONFIRMED") return "confirmed";
  if (normalized === "PAID") return "paid";
  if (normalized === "VOID") return "voided";
  return "calculated";
}

function calculateTotals(list: AssistantEarningRow[]) {
  const sum = (status: AssistantEarningStatus) =>
    list
      .filter((earning) => earning.status === status)
      .reduce((total, earning) => total + earning.amount, 0);
  return {
    thisMonth: sum("calculated") + sum("confirmed") + sum("paid"),
    pending: sum("calculated"),
    confirmed: sum("confirmed"),
    paid: sum("paid"),
    ytd: list.reduce(
      (total, earning) => total + (earning.status === "voided" ? 0 : earning.amount),
      0,
    ),
  };
}

function getRefId(
  value: PayrollEarning["taskId"] | PayrollEarning["seriesId"] | PayrollEarning["chapterId"],
) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.id ?? value._id ?? "";
}

function getRefLabel(
  value: PayrollEarning["taskId"] | PayrollEarning["seriesId"] | PayrollEarning["chapterId"],
  fallback: string,
) {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  const chapterNumber = "chapterNumber" in value ? value.chapterNumber : undefined;
  return value.title ?? chapterNumber ?? value.id ?? value._id ?? fallback;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
