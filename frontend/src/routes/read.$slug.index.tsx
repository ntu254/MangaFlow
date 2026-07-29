import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  fetchPublicSeries,
  isPublicNotFound,
  publicAssetUrl,
} from "@/entities/reader/model/public-reader";

export const Route = createFileRoute("/read/$slug/")({
  loader: async ({ params }) => {
    try {
      return await fetchPublicSeries(params.slug);
    } catch (error) {
      if (isPublicNotFound(error)) throw notFound();
      throw error;
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — beachRead` },
          {
            name: "description",
            content: loaderData.synopsis.slice(0, 150),
          },
          { property: "og:title", content: `${loaderData.title} — beachRead` },
          {
            property: "og:description",
            content: loaderData.synopsis.slice(0, 150),
          },
          {
            property: "og:image",
            content: publicAssetUrl(loaderData.coverUrl),
          },
        ]
      : [],
  }),
  component: SeriesDetail,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-serif text-4xl">Series not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This series is not published or is no longer available.
      </p>
      <Link to="/read" className="mt-4 inline-block text-sm text-accent underline">
        Back to catalog
      </Link>
    </main>
  ),
});

function SeriesDetail() {
  const series = Route.useLoaderData();
  const chapters = [...series.chapters].sort((left, right) => right.number - left.number);
  const firstChapter = chapters.at(-1);
  const latestChapter = chapters.at(0);

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        {series.coverUrl ? (
          <img
            src={publicAssetUrl(series.coverUrl)}
            alt={series.title}
            width={400}
            height={600}
            className="aspect-[2/3] w-full rounded object-cover ring-1 ring-border"
          />
        ) : (
          <div className="grid aspect-[2/3] w-full place-items-center rounded bg-card px-6 text-center font-serif text-3xl ring-1 ring-border">
            {series.title}
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            By {series.authorName || "Independent creator"}
          </p>
          <h1 className="mt-2 font-serif text-6xl leading-none">{series.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {series.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
              >
                {genre}
              </span>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-foreground/80">
            {series.synopsis || "Synopsis coming soon."}
          </p>
          {firstChapter && latestChapter ? (
            <div className="mt-6 flex items-center gap-3">
              <Link
                to="/read/$slug/$chapter"
                params={{
                  slug: series.slug,
                  chapter: String(firstChapter.number),
                }}
                className="rounded bg-foreground px-5 py-2 text-xs font-semibold text-background"
              >
                Start Chapter {firstChapter.number}
              </Link>
              <Link
                to="/read/$slug/$chapter"
                params={{
                  slug: series.slug,
                  chapter: String(latestChapter.number),
                }}
                className="rounded border border-border px-5 py-2 text-xs font-semibold"
              >
                Latest Chapter {latestChapter.number}
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 font-serif text-2xl">Published chapters</h2>
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <Link
                to="/read/$slug/$chapter"
                params={{
                  slug: series.slug,
                  chapter: String(chapter.number),
                }}
                className="flex items-center justify-between gap-4 px-4 py-3 text-xs hover:bg-muted"
              >
                <span className="font-semibold">
                  Chapter {chapter.number}: {chapter.title}
                </span>
                <span className="text-muted-foreground">
                  {chapter.pageCount} {chapter.pageCount === 1 ? "page" : "pages"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
