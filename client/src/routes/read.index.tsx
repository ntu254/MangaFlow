import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Lock } from "lucide-react";

export const Route = createFileRoute("/read/")({
  head: () => ({
    meta: [
      { title: "Reader unavailable — MangaFlow MVP" },
      {
        name: "description",
        content: "The public reader is not part of the current MangaFlow workflow MVP.",
      },
    ],
  }),
  component: ReaderBoundaryPage,
});

function ReaderBoundaryPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-3xl place-items-center px-6 py-16">
      <section className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
          <Lock className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-5 font-serif text-4xl">Reader is outside the MVP scope</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          MangaFlow currently covers the internal editorial workflow through publication. Public
          reader/catalog delivery will be added only when the published-chapter API is designed.
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
