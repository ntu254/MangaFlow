import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/app/publications")({
  head: () => ({
    meta: [
      { title: "Publication Calendar - beachRead Studio" },
      {
        name: "description",
        content: "Publication schedules are managed in each Series Workspace.",
      },
      { property: "og:title", content: "Publication Calendar - beachRead Studio" },
      { property: "og:description", content: "Publishing schedule." },
    ],
  }),
  component: PublicationsPage,
});

// MF-009: Standalone /app/publications previously rendered <PublicationCalendar /> without
// required series/chapters/seriesId props, resulting in an empty calendar.
// The Publication Calendar is context-aware and lives inside each Series Workspace
// (series.$slug.tsx, "calendar" tab) where it receives live series and chapter data.
// This standalone route now shows a clear informational page with a CTA to My Series.
function PublicationsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Editorial
        </p>
        <h1 className="font-serif text-4xl">Publication Calendar</h1>
      </header>

      <div className="flex flex-col items-center gap-6 rounded-md border border-border bg-card px-8 py-16 text-center">
        <CalendarDays className="size-12 text-muted-foreground" />
        <div className="space-y-2">
          <p className="font-serif text-xl">
            Publication schedules are managed in each Series Workspace
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Select a series to view readiness, scheduled dates, and published state for each
            chapter.
          </p>
        </div>
        <Link
          to="/app/series"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-5 text-sm font-semibold text-background hover:opacity-90"
        >
          Go to My Series
        </Link>
      </div>
    </div>
  );
}
