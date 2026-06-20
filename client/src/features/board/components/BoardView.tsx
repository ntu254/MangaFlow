import { PageHeader } from "@/layouts/AppShell";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { ballots, findSeries, findStaff } from "@/entities";
import { useState } from "react";
import { Check, X, AlertTriangle } from "lucide-react";

export function BoardView() {
  const [activeId, setActiveId] = useState(ballots[0]?.id);
  const active = ballots.find((b) => b.id === activeId);

  return (
    <div>
      <PageHeader
        title="Board voting"
        jp="編集会議"
        description="Approve, request revision, or reject series and manuscripts."
      />
      <div className="grid grid-cols-[320px_1fr] gap-4">
        <aside className="space-y-2">
          {ballots.map((b) => {
            const s = findSeries(b.seriesId)!;
            return (
              <button
                key={b.id}
                onClick={() => setActiveId(b.id)}
                className={`block w-full rounded-md border px-3 py-2.5 text-left text-[13px] transition ${
                  b.id === activeId
                    ? "border-primary bg-primary/5"
                    : "border-foreground/10 bg-card hover:border-foreground/25"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.title}</span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="mt-0.5 text-[11px] text-foreground/55">
                  {b.reason} · opened {b.openedAt}
                </div>
              </button>
            );
          })}
        </aside>

        {active && (
          <section className="rounded-md border border-foreground/10 bg-card">
            <header className="border-b border-foreground/10 px-5 py-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground/55">
                {active.reason}
              </div>
              <h2 className="mt-0.5 text-lg font-semibold">{findSeries(active.seriesId)?.title}</h2>
            </header>
            <div className="grid grid-cols-[1fr_280px] gap-6 p-5">
              <div>
                <div className="text-[12px] font-medium text-foreground/55">Your vote</div>
                <div className="mt-2 flex gap-2">
                  <VoteBtn tone="success" icon={<Check className="h-4 w-4" />} label="Approve" />
                  <VoteBtn
                    tone="warn"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    label="Needs revision"
                  />
                  <VoteBtn tone="danger" icon={<X className="h-4 w-4" />} label="Reject" />
                </div>
                <textarea
                  placeholder="Note for the record…"
                  className="mt-3 w-full rounded-md border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  rows={4}
                />
              </div>
              <aside>
                <div className="text-[12px] font-medium text-foreground/55">Tally</div>
                <div className="mt-2 space-y-2">
                  {active.votes.map((v, i) => (
                    <div key={i} className="rounded border border-foreground/10 p-2.5">
                      <div className="text-[12px] font-medium">{findStaff(v.staffId)?.name}</div>
                      <div className="text-[11px] uppercase text-foreground/55">{v.vote}</div>
                      <div className="mt-1 text-[12px] text-foreground/70">{v.note}</div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function VoteBtn({
  tone,
  icon,
  label,
}: {
  tone: "success" | "warn" | "danger";
  icon: React.ReactNode;
  label: string;
}) {
  const map = {
    success: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10",
    warn: "border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10",
    danger: "border-destructive/30 text-destructive hover:bg-destructive/10",
  };
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium ${map[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
}
