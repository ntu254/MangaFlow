import { createFileRoute, Link } from "@tanstack/react-router";
import {
  fetchPublicSeriesList,
  publicAssetUrl,
} from "@/entities/reader/model/public-reader";

export const Route = createFileRoute("/read/")({
  loader: () => fetchPublicSeriesList(),
  head: () => ({
    meta: [
      { title: "Catalog — beachRead" },
      {
        name: "description",
        content: "Browse manga chapters published on beachRead.",
      },
      { property: "og:title", content: "Catalog — beachRead" },
      {
        property: "og:description",
        content: "Explore published manga on beachRead.",
      },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const series = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10">
      <header className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Catalog
          </p>
          <h1 className="mt-1 font-serif text-5xl">Published Series</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          {series.length} {series.length === 1 ? "series" : "series"} available
        </p>
      </header>

      {series.length === 0 ? (
        <section className="rounded-lg border border-dashed border-border px-6 py-20 text-center">
          <h2 className="font-serif text-2xl">No published series yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Approved chapters will appear here after their scheduled publication.
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {series.map((item) => (
            <Link
              key={item.id}
              to="/read/$slug"
              params={{ slug: item.slug }}
              className="group"
            >
              {item.coverUrl ? (
                <img
                  src={publicAssetUrl(item.coverUrl)}
                  alt={item.title}
                  width={400}
                  height={600}
                  loading="lazy"
                  className="aspect-[2/3] w-full rounded object-cover ring-1 ring-border transition-transform group-hover:-translate-y-1"
                />
              ) : (
                <div className="grid aspect-[2/3] w-full place-items-center rounded bg-card px-4 text-center font-serif text-2xl ring-1 ring-border transition-transform group-hover:-translate-y-1">
                  {item.title}
                </div>
              )}
              <h2 className="mt-3 font-serif text-lg leading-tight">{item.title}</h2>
              <p className="text-[11px] text-muted-foreground">
                {item.authorName || "Independent creator"} · {item.chapters.length}{" "}
                {item.chapters.length === 1 ? "chapter" : "chapters"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
