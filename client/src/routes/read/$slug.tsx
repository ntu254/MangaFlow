import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Logo } from "@/shared/ui/site/Logo";
import { ThemeToggle } from "@/shared/ui/site/ThemeToggle";
import { publicGetSeries, publicListChapters } from "@/shared/lib/public-api";

export const Route = createFileRoute("/read/$slug")({
  loader: ({ params }) => {
    const s = publicGetSeries(params.slug);
    if (!s) throw notFound();
    return { series: s, chapters: publicListChapters(params.slug) };
  },
  notFoundComponent: () => (
    <div className="p-12 text-center text-sm text-foreground/55">Series not found.</div>
  ),
  component: SeriesPage,
});

function SeriesPage() {
  const { series, chapters } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex items-center justify-between">
        <Link to="/read">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <div className="mt-8 grid grid-cols-[200px_1fr] gap-6">
        <img
          src={series.cover}
          alt={series.title}
          className="aspect-[3/4] w-full rounded-md object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">{series.title}</h1>
          <div className="font-jp text-foreground/55">{series.jp}</div>
          <p className="mt-4 text-sm text-foreground/70">
            {series.synopsis || "No synopsis available."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {series.tags.map((t: string) => (
              <span
                key={t}
                className="rounded-full border border-foreground/15 px-2 py-0.5 text-[11px] text-foreground/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-foreground/55">
          Chapters
        </h2>
        <div className="overflow-hidden rounded-md border border-foreground/10 bg-card">
          {chapters.length === 0 && (
            <div className="px-4 py-6 text-sm text-foreground/55">No chapters available yet.</div>
          )}
          {chapters.map((c: (typeof chapters)[number]) => (
            <Link
              key={c.id}
              to="/read/$slug/$chapter"
              params={{ slug: series.slug, chapter: c.id }}
              className="flex items-center justify-between border-b border-foreground/5 px-4 py-3 text-[13px] hover:bg-accent/40 last:border-b-0"
            >
              <div>
                <div className="font-medium">
                  {c.number} — {c.title}
                </div>
                <div className="text-[11px] text-foreground/55">
                  {c.pages} pages {c.publishedAt && `· ${c.publishedAt}`}
                </div>
              </div>
              <span className="text-[11px] text-foreground/55">Read →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
