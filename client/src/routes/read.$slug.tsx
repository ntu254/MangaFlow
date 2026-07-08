import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { findSeries } from "@/lib/mock/manga";

export const Route = createFileRoute("/read/$slug")({
  loader: ({ params }) => {
    const s = findSeries(params.slug);
    if (!s) throw notFound();
    return s;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — beachRead` },
          { name: "description", content: loaderData.synopsis.slice(0, 150) },
          { property: "og:title", content: `${loaderData.title} — beachRead` },
          { property: "og:description", content: loaderData.synopsis.slice(0, 150) },
          { property: "og:image", content: loaderData.cover },
          { property: "twitter:image", content: loaderData.cover },
        ]
      : [],
  }),
  component: SeriesDetail,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-serif text-4xl">Series không tồn tại</h1>
      <Link to="/read" className="mt-4 inline-block text-sm text-accent underline">
        Quay lại catalog
      </Link>
    </main>
  ),
  errorComponent: ({ reset }) => (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-serif text-3xl">Không tải được series.</h1>
      <button
        onClick={reset}
        className="mt-4 rounded bg-foreground px-4 py-2 text-xs text-background"
      >
        Thử lại
      </button>
    </main>
  ),
});

function SeriesDetail() {
  const s = Route.useLoaderData();
  const chapters = Array.from({ length: Math.min(20, s.chapters) }, (_, i) => s.chapters - i);
  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <img
          src={s.cover}
          alt={s.title}
          width={400}
          height={600}
          className="aspect-[2/3] w-full rounded object-cover ring-1 ring-border"
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            By {s.author}
          </p>
          <h1 className="mt-2 font-serif text-6xl leading-none">{s.title}</h1>
          <p className="mt-2 text-2xl text-muted-foreground">{s.romaji}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {s.genres.map((g: string) => (
              <span
                key={g}
                className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
              >
                {g}
              </span>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-foreground/80">{s.synopsis}</p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              to="/read/$slug/$chapter"
              params={{ slug: s.slug, chapter: "1" }}
              className="rounded bg-foreground px-5 py-2 text-xs font-semibold text-background"
            >
              Start Chapter 1
            </Link>
            <Link
              to="/read/$slug/$chapter"
              params={{ slug: s.slug, chapter: String(s.chapters) }}
              className="rounded border border-border px-5 py-2 text-xs font-semibold"
            >
              Latest Chapter {s.chapters}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="mb-4 font-serif text-2xl">Chapters</h2>
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {chapters.map((c) => (
            <li key={c}>
              <Link
                to="/read/$slug/$chapter"
                params={{ slug: s.slug, chapter: String(c) }}
                className="flex items-center justify-between px-4 py-3 text-xs hover:bg-muted"
              >
                <span className="font-semibold">Chapter {c}</span>
                <span className="text-muted-foreground">{s.updatedAt} ago</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
