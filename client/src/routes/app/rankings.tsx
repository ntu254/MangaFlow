import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { rankings, findSeries } from "@/entities";
import { num } from "@/shared/lib/format";
import { Lock, Upload } from "lucide-react";

export const Route = createFileRoute("/app/rankings")({
  component: () => (
    <div>
      <PageHeader
        title="Rankings"
        jp="ランキング"
        description="Reader vote tallies. Board imports, reviews and locks."
        actions={
          <button className="inline-flex h-9 items-center gap-2 rounded-md border border-foreground/15 px-3 text-sm hover:bg-foreground/5">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
        }
      />
      <div className="space-y-6">
        {rankings.map((rk) => (
          <section key={rk.id} className="rounded-md border border-foreground/10 bg-card">
            <header className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-foreground/55">
                  Period
                </div>
                <h2 className="text-base font-semibold">{rk.period}</h2>
              </div>
              <button
                disabled={rk.locked}
                className="inline-flex items-center gap-1.5 rounded-md border border-foreground/15 px-3 py-1.5 text-[12px] disabled:opacity-60"
              >
                <Lock className="h-3.5 w-3.5" /> {rk.locked ? "Locked" : "Lock results"}
              </button>
            </header>
            <div className="divide-y divide-foreground/5">
              {rk.entries.map((e) => {
                const s = findSeries(e.seriesId)!;
                return (
                  <div key={e.seriesId} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                    <span className="w-6 text-center text-[12px] font-semibold text-foreground/55">
                      {e.rank}
                    </span>
                    <img src={s.cover} alt="" className="h-9 w-7 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{s.title}</div>
                      <div className="truncate font-jp text-[11px] text-foreground/55">{s.jp}</div>
                    </div>
                    <span className="tabular-nums text-foreground/70">{num(e.votes)} votes</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  ),
});
