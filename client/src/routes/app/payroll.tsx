import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { payroll, findTask, findChapter, findSeries, findStaff } from "@/entities";
import { jpy } from "@/shared/lib/format";

export const Route = createFileRoute("/app/payroll")({
  component: () => {
    const total = payroll.reduce((a, b) => a + b.amount, 0);
    return (
      <div>
        <PageHeader
          title="Payroll"
          jp="給与"
          description="Confirm task earnings and mark payouts."
        />
        <div className="mb-4 inline-flex items-center gap-3 rounded-md border border-foreground/10 bg-card px-4 py-2 text-[12px]">
          <span className="text-foreground/55">Period</span>
          <span className="font-semibold">2026 · June</span>
          <span className="mx-2 h-3 w-px bg-foreground/15" />
          <span className="text-foreground/55">Total</span>
          <span className="font-semibold tabular-nums">{jpy(total)}</span>
        </div>
        <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
          <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1fr_1fr_auto] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
            <span>Assistant</span>
            <span>Series</span>
            <span>Task</span>
            <span>Amount</span>
            <span>Status</span>
            <span />
          </div>
          {payroll.map((p) => {
            const t = findTask(p.taskId)!;
            const ch = findChapter(t.chapterId)!;
            const s = findSeries(ch.seriesId)!;
            const a = findStaff(t.assigneeId)!;
            return (
              <div
                key={p.id}
                className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1fr_1fr_auto] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] last:border-b-0"
              >
                <span className="font-medium">{a.name}</span>
                <span>{s.title}</span>
                <span className="text-foreground/70">
                  {t.type} · {ch.number}
                </span>
                <span className="tabular-nums">{jpy(p.amount)}</span>
                <StatusBadge status={p.status} />
                <div className="flex gap-2">
                  {p.status === "pending" && (
                    <button className="rounded border border-foreground/15 px-2 py-1 text-[11px] hover:bg-foreground/5">
                      Confirm
                    </button>
                  )}
                  {p.status === "confirmed" && (
                    <button className="rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90">
                      Mark paid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
});
