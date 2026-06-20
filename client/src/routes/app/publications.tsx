import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { publications, findChapter, findSeries } from "@/entities";

export const Route = createFileRoute("/app/publications")({
  component: () => (
    <div>
      <PageHeader
        title="Publications"
        jp="刊行スケジュール"
        description="Schedule, unschedule, mark production-ready or publish now."
      />
      <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
        <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
          <span>Series</span>
          <span>Chapter</span>
          <span>Scheduled</span>
          <span>State</span>
          <span />
        </div>
        {publications.map((p) => {
          const ch = findChapter(p.chapterId)!;
          const s = findSeries(ch.seriesId)!;
          return (
            <div
              key={p.id}
              className="grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] last:border-b-0"
            >
              <span className="font-medium">{s.title}</span>
              <span>
                {ch.number} — {ch.title}
              </span>
              <span className="text-foreground/70">{p.scheduledAt}</span>
              <StatusBadge status={p.state} />
              <div className="flex gap-2">
                <button className="rounded border border-foreground/15 px-2 py-1 text-[11px] hover:bg-foreground/5">
                  Reschedule
                </button>
                <button className="rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90">
                  Publish
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ),
});
