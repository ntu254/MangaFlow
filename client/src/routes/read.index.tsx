import { createFileRoute, Link } from "@tanstack/react-router";
import { series } from "@/lib/mock/manga";

export const Route = createFileRoute("/read/")({
  head: () => ({
    meta: [
      { title: "Catalog — beachRead" },
      { name: "description", content: "Toàn bộ catalog manga đang xuất bản trên beachRead." },
      { property: "og:title", content: "Catalog — beachRead" },
      { property: "og:description", content: "Khám phá toàn bộ catalog manga trên beachRead." },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Catalog</p>
          <h1 className="mt-1 font-serif text-5xl">All Series</h1>
        </div>
        <p className="text-xs text-muted-foreground">{series.length} series đang được phát hành</p>
      </header>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {series.map((s) => (
          <Link key={s.slug} to="/read/$slug" params={{ slug: s.slug }} className="group">
            <img
              src={s.cover}
              alt={s.title}
              width={400}
              height={600}
              loading="lazy"
              className="aspect-[2/3] w-full rounded object-cover ring-1 ring-border transition-transform group-hover:-translate-y-1"
            />
            <h3 className="mt-3 font-serif text-lg leading-tight">{s.title}</h3>
            <p className="text-[11px] text-muted-foreground">{s.author}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
