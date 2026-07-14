import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Lock } from "lucide-react";

export const Route = createFileRoute("/read/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Reader unavailable — ${params.slug}` },
      {
        name: "description",
        content: "The public series reader is not part of the current MangaFlow workflow MVP.",
      },
    ],
  }),
  component: SeriesReaderBoundary,
});

function SeriesReaderBoundary() {
  const { slug } = Route.useParams();

  return (
    <main className="mx-auto grid min-h-screen max-w-3xl place-items-center px-6 py-16">
      <section className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
          <Lock className="size-5 text-muted-foreground" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {slug}
        </p>
        <h1 className="mt-2 font-serif text-4xl">Public series pages are not active yet</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Published chapters are managed by Tantou workflow actions in the MVP. A public reader
          should be wired from real publication APIs before it is enabled.
        </p>
        <Link
          to="/app/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90"
        >
          Open workflow dashboard <BookOpen className="size-3.5" />
        </Link>
      </section>
    </main>
  );
}
