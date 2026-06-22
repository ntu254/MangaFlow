import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Wallet } from "lucide-react";
import { PageHeader, StatCard } from "@/layouts/AppShell";
import { payrollApi, type PayrollEarning } from "@/shared/api/payroll";
import { extractErrorMessage } from "@/shared/api";
import { payrollMoney } from "@/shared/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/payroll")({
  component: AdminPayrollPage,
});

function AdminPayrollPage() {
  const qc = useQueryClient();
  const {
    data: earnings = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "payroll"],
    queryFn: payrollApi.listEarnings,
  });
  const confirm = useMutation({
    mutationFn: payrollApi.confirmTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "payroll"] });
      toast.success("Payroll confirmed");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
  const markPaid = useMutation({
    mutationFn: payrollApi.markPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "payroll"] });
      toast.success("Payroll marked paid");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const total = earnings.reduce((sum, earning) => sum + Number(earning.amount || 0), 0);
  const totalCurrency = earnings[0]?.currency ?? "VND";
  const pending = earnings.filter((earning) => normalizeStatus(earning.status) === "pending");
  const confirmed = earnings.filter((earning) => normalizeStatus(earning.status) === "confirmed");

  return (
    <div className="admin-console admin-page space-y-5">
      <PageHeader
        title="Payroll"
        jp="Monthly payout"
        description="View monthly payroll, review assistant earnings, confirm pending payroll, and mark paid."
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          label="Monthly payroll"
          value={formatMoney(total, totalCurrency)}
          hint="Current loaded period"
        />
        <StatCard label="Assistant earnings" value={String(earnings.length)} />
        <StatCard label="Pending confirm" value={String(pending.length)} />
        <StatCard label="Ready to pay" value={String(confirmed.length)} />
      </div>

      <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_auto] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
          <span>Assistant</span>
          <span>Series</span>
          <span>Task</span>
          <span>Amount</span>
          <span>Status</span>
          <span />
        </div>
        {error ? (
          <div className="px-4 py-8 text-sm text-destructive">{(error as Error).message}</div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-foreground/50">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : earnings.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-foreground/50">
            No payroll earnings for this period.
          </div>
        ) : (
          earnings.map((earning) => {
            const status = normalizeStatus(earning.status);
            const earningId = earning.id ?? earning._id ?? "";
            const taskId = getId(earning.taskId);
            return (
              <div
                key={earningId || taskId}
                className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_auto] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] last:border-b-0"
              >
                <span className="font-medium">{personLabel(earning.assistantId)}</span>
                <span className="truncate text-foreground/70">{entityLabel(earning.seriesId)}</span>
                <span className="truncate text-foreground/70">{entityLabel(earning.taskId)}</span>
                <span className="tabular-nums">
                  {formatMoney(earning.amount, earning.currency)}
                </span>
                <span className={statusTone(status)}>{status}</span>
                <div className="flex justify-end gap-1.5">
                  {status === "pending" && taskId && (
                    <button
                      onClick={() => confirm.mutate(taskId)}
                      disabled={confirm.isPending}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 text-xs text-foreground/70 disabled:opacity-40"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      Confirm
                    </button>
                  )}
                  {status === "confirmed" && earningId && (
                    <button
                      onClick={() => markPaid.mutate(earningId)}
                      disabled={markPaid.isPending}
                      className="h-7 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
                    >
                      Mark paid
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function normalizeStatus(status: PayrollEarning["status"]) {
  return String(status).toLowerCase();
}

function getId(value: PayrollEarning["taskId"]) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.id ?? value._id ?? "";
}

function entityLabel(value: PayrollEarning["taskId"] | PayrollEarning["seriesId"]) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return value.title || value.id || value._id || "-";
}

function personLabel(value: PayrollEarning["assistantId"]) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return value.name || value.email || value.id || value._id || "-";
}

function statusTone(status: string) {
  if (status === "paid") return "capitalize text-emerald-500";
  if (status === "confirmed") return "capitalize text-sky-500";
  if (status === "pending") return "capitalize text-amber-500";
  return "capitalize text-foreground/45";
}

function formatMoney(value: number, currency = "VND") {
  return payrollMoney(value || 0, currency);
}
