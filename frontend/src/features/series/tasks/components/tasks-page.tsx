import { Link } from "@tanstack/react-router";
import { ChapterStatusPill } from "@/entities/chapter";
import { useAuth } from "@/shared/auth";
import { formatDate } from "@/shared/lib/format-date";
import { useMyChaptersQuery, useMySeriesQuery } from "../../api/series-queries";

export function TasksPage() {
  const user = useAuth((s) => s.user);
  const {
    data: chapters = [],
    isLoading: chaptersLoading,
    isError: chaptersError,
  } = useMyChaptersQuery();
  const { data: series = [] } = useMySeriesQuery();

  if (!user) return null;

  if (chaptersLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Production
          </p>
          <h1 className="font-serif text-4xl">Your tasks</h1>
        </header>
        <div className="rounded-md border border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
          Loading tasks...
        </div>
      </div>
    );
  }

  if (chaptersError) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Production
          </p>
          <h1 className="font-serif text-4xl">Your tasks</h1>
        </header>
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-12 text-center text-sm text-destructive">
          Could not load your task list. You may not have access, or the request failed.
        </div>
      </div>
    );
  }

  const mine = chapters.filter((c) => {
    if (user.role === "editor" || user.role === "admin") {
      return c.status === "TANTOU_REVIEW" || c.status === "READY_FOR_PUBLICATION";
    }
    if (user.role === "mangaka" || user.role === "assistant") {
      return (
        c.assigneeId === user.id &&
        (c.status === "PLANNED" || c.status === "IN_PRODUCTION" || c.status === "REVISION_REQUIRED")
      );
    }
    return false;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Production
        </p>
        <h1 className="font-serif text-4xl">Your tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mine.length} chapters waiting for action ({user.role}).
        </p>
      </header>
      {mine.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
          No tasks are assigned to you.
        </div>
      ) : (
        <ul className="space-y-2">
          {mine.map((c) => {
            const s = series.find((x) => x.id === c.seriesId);
            return (
              <li key={c.id}>
                <Link
                  to="/app/series/$slug/$tab"
                  params={{ slug: s?.slug ?? "", tab: "overview" }}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 hover:border-foreground/40"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">{s?.title}</p>
                    <p className="font-serif text-base">
                      Ch. {c.number} - {c.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>Due {formatDate(c.draftDueAt ?? c.reviewDueAt ?? c.scheduledAt)}</span>
                    <ChapterStatusPill status={c.status} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
