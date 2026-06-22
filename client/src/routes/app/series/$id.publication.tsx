import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";
import { CalendarClock, CheckCircle2, Clock, Radio, Trophy } from "lucide-react";
import { PageHeader } from "@/layouts/AppShell";
import { useSeriesSummary } from "@/shared/queries/useSeries";
import { usePublications } from "@/shared/queries/usePublications";
import type { Publication, PublicationChapter } from "@/shared/api/publications";

export const Route = createFileRoute("/app/series/$id/publication")({
  component: PublicationMonitorPage,
});

function PublicationMonitorPage() {
  const { id } = Route.useParams();
  const { data: summary, isLoading: summaryLoading } = useSeriesSummary(id);
  const {
    data: publications = [],
    isLoading: publicationsLoading,
    isError: publicationsError,
  } = usePublications(id);

  if (summaryLoading) {
    return (
      <div className="p-8 text-sm text-foreground/55 animate-pulse">Loading publication...</div>
    );
  }

  if (!summary?.series) {
    return <div className="p-8 text-sm text-foreground/55">Series not found.</div>;
  }

  const { series } = summary;
  const publicationSummary = summary.publicationSummary ?? {
    isReady: false,
    scheduled: 0,
    published: 0,
    blockers: ["Publication readiness has not been calculated yet."],
  };
  const ranking = summary.rankingSummary;
  const board = summary.boardReview;
  const chapters = summary.chapters ?? [];
  const monitoredPublications = publications.length
    ? publications
    : chapters
        .filter((chapter) => chapter.draftSchedule || chapter.status === "PUBLISHED")
        .map(
          (chapter) =>
            ({
              id: `chapter-${chapter.id}`,
              chapterId: {
                id: chapter.id,
                chapterNumber: chapter.chapterNumber ?? 0,
                title: chapter.title ?? `Chapter ${chapter.chapterNumber ?? ""}`,
                status: chapter.status ?? "DRAFT",
              },
              seriesId: id,
              status: chapter.status === "PUBLISHED" ? "PUBLISHED" : "SCHEDULED",
              scheduledFor: chapter.draftSchedule,
              publishedAt: chapter.status === "PUBLISHED" ? chapter.updatedAt : undefined,
              createdAt: chapter.updatedAt,
              updatedAt: chapter.updatedAt,
            }) satisfies Publication,
        );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 pt-2">
      <PageHeader
        title={`${series.title} · Publication Monitor`}
        jp="公開監視"
        description={
          <Link
            to="/app/series/$id"
            params={{ id: series.id }}
            className="underline-offset-2 hover:underline"
          >
            ← Back to series
          </Link>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Ready"
          value={publicationSummary.isReady ? "Yes" : "No"}
          tone={publicationSummary.isReady ? "emerald" : "amber"}
        />
        <MetricCard
          icon={<CalendarClock className="h-4 w-4" />}
          label="Scheduled"
          value={publicationSummary.scheduled}
          tone="sky"
        />
        <MetricCard
          icon={<Radio className="h-4 w-4" />}
          label="Published"
          value={publicationSummary.published}
          tone="violet"
        />
        <MetricCard
          icon={<Trophy className="h-4 w-4" />}
          label="Reader votes"
          value={ranking?.voteCount ?? 0}
          tone="slate"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded-xl border border-foreground/10 bg-card shadow-sm">
          <header className="border-b border-foreground/10 px-5 py-4">
            <h2 className="text-sm font-extrabold text-foreground">Publishing schedule</h2>
            <p className="mt-1 text-xs text-foreground/55">
              Read-only view for Mangaka. Tantou Editor manages schedule and publish actions.
            </p>
          </header>

          {publicationsLoading ? (
            <div className="p-6 text-sm text-foreground/50">Loading schedule...</div>
          ) : monitoredPublications.length === 0 ? (
            <div className="p-6 text-sm text-foreground/50">
              No publishing schedule yet. It will appear here after Editor creates one.
            </div>
          ) : (
            <div className="divide-y divide-foreground/10">
              {monitoredPublications.map((publication) => (
                <PublicationRow key={publication.id} publication={publication} />
              ))}
            </div>
          )}

          {publicationsError && (
            <div className="border-t border-amber-500/20 bg-amber-500/5 px-5 py-3 text-xs text-amber-700 dark:text-amber-300">
              Could not load detailed publication records. Showing series summary instead.
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-foreground/55">
              Board decision
            </h2>
            {board ? (
              <div className="mt-3 space-y-2 text-sm">
                <div className="font-bold text-foreground">{board.result ?? board.status}</div>
                <div className="text-xs text-foreground/55">
                  {board.voteCount ?? 0} vote(s)
                  {board.updatedAt ? ` · Updated ${formatDate(board.updatedAt)}` : ""}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-foreground/55">
                No Board decision has been recorded for this series yet.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-foreground/55">
              Ranking / reader vote
            </h2>
            {ranking ? (
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Info label="Period" value={ranking.period ?? "Current"} />
                <Info label="Status" value={ranking.status ?? "Draft"} />
                <Info label="Reader score" value={ranking.readerScore ?? "—"} />
                <Info label="Final score" value={ranking.finalScore ?? "—"} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-foreground/55">
                Ranking and reader vote data will appear after publication.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-foreground/55">
              Current blockers
            </h2>
            {publicationSummary.blockers.length === 0 ? (
              <p className="mt-3 text-sm text-emerald-600">No publication blockers.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-foreground/65">
                {publicationSummary.blockers.map((blocker) => (
                  <li key={blocker} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {blocker}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function PublicationRow({ publication }: { publication: Publication }) {
  const chapter = publication.chapterId as PublicationChapter;
  const title =
    typeof publication.chapterId === "string"
      ? `Chapter ${publication.chapterId}`
      : `Chapter ${chapter.chapterNumber}: ${chapter.title}`;
  const date = publication.publishedAt ?? publication.scheduledFor;

  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-bold text-foreground">{title}</div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-foreground/55">
          <Clock className="h-3.5 w-3.5" />
          {date ? formatDate(date) : "Date not scheduled"}
        </div>
      </div>
      <span className="w-fit rounded-md bg-foreground/7 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground/65">
        {publication.status}
      </span>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: "emerald" | "amber" | "sky" | "violet" | "slate";
}) {
  const toneClass = {
    emerald: "text-emerald-600 bg-emerald-500/10",
    amber: "text-amber-600 bg-amber-500/10",
    sky: "text-sky-600 bg-sky-500/10",
    violet: "text-violet-600 bg-violet-500/10",
    slate: "text-foreground/70 bg-foreground/10",
  }[tone];

  return (
    <div className="rounded-xl border border-foreground/10 bg-card p-4 shadow-sm">
      <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-md ${toneClass}`}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-foreground">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-foreground/50">
        {label}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/45">
        {label}
      </div>
      <div className="mt-1 font-semibold text-foreground">{value}</div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
