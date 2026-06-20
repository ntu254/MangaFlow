import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/layouts/AppShell";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { chapters, findSeries, findStaff } from "@/entities";

export const Route = createFileRoute("/app/review")({
  component: () => {
    const queue = chapters.filter((c) => c.status === "in-review" || c.status === "revision");
    return (
      <div>
        <PageHeader
          title="Review queue"
          jp="査読待ち"
          description="Manuscripts awaiting editorial review or revision."
        />
        <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
          <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-3 border-b border-foreground/10 bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-foreground/55">
            <span>Series</span>
            <span>Chapter</span>
            <span>Mangaka</span>
            <span>Status</span>
            <span>Pages</span>
            <span />
          </div>
          {queue.map((c) => {
            const s = findSeries(c.seriesId)!;
            return (
              <div
                key={c.id}
                className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] items-center gap-3 border-b border-foreground/5 px-4 py-3 text-[13px] hover:bg-accent/40 last:border-b-0"
              >
                <span className="font-medium">{s.title}</span>
                <span>
                  {c.number} — {c.title}
                </span>
                <span className="text-foreground/70">{findStaff(s.mangakaId)?.name}</span>
                <StatusBadge status={c.status} />
                <span className="text-foreground/70">{c.pages}</span>
                <Link
                  to="/app/series/$id"
                  params={{ id: s.id }}
                  className="rounded border border-foreground/15 px-2 py-1 text-[11px] hover:bg-foreground/5"
                >
                  Open
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
});
