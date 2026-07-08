import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Bookmark, ChevronRight, Newspaper } from "lucide-react";
import { SiteHeader } from "@/shared/layout/shell/site-header";
import { SiteFooter } from "@/shared/layout/shell/site-footer";
import { heroSeries, latestUpdates, recentlyAdded, series } from "@/lib/mock/manga";
import { featuredNews, sideNews } from "@/lib/mock/news";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "beachRead — Trending manga, ranking & latest chapters" },
      {
        name: "description",
        content:
          "Đọc manga trending, theo dõi ranking, cập nhật chapter mới mỗi ngày trên beachRead.",
      },
      { property: "og:title", content: "beachRead — Trending manga & latest chapters" },
      { property: "og:description", content: "Bringing the best of manga to readers worldwide." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div
      className="min-h-screen bg-background text-foreground bg-paper-grain"
      suppressHydrationWarning
    >
      <SiteHeader />
      <main>
        <Hero />
        <RankingSection />
        <LatestUpdates />
        <RecentlyAdded />
        <LatestNews />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-10">
      <div className="relative overflow-hidden rounded-md">
        <img
          src={heroSeries.cover}
          alt={heroSeries.title}
          width={1920}
          height={896}
          className="h-[560px] w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <div>
            <h2 className="text-lg font-semibold">Trending Now</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {heroSeries.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-foreground/15 bg-card/70 px-2.5 py-0.5 text-[10px] font-medium"
                >
                  {g}
                </span>
              ))}
            </div>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-foreground/70">
              {heroSeries.synopsis}
            </p>
          </div>
          <div>
            <h1 className="font-serif text-7xl leading-none tracking-tight text-foreground">
              {heroSeries.title}
            </h1>
            <p className="mt-2 text-2xl text-foreground/60">{heroSeries.romaji}</p>
            <div className="mt-6 flex items-center gap-2">
              <Link
                to="/read/$slug/$chapter"
                params={{ slug: heroSeries.slug, chapter: "1" }}
                className="inline-flex items-center gap-2 rounded bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-foreground/90"
              >
                Chapter 1
                <ChevronRight className="size-3.5" />
              </Link>
              <button className="grid size-9 place-items-center rounded border border-foreground/20 bg-card/60 hover:bg-card">
                <Bookmark className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RankingSection() {
  const left = series.slice(0, 5);
  const right = series.slice(5, 10);
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-16">
      <div className="rounded-md border border-border bg-card/50 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <button className="rounded bg-foreground px-3 py-1 text-xs font-semibold text-background">
              Trending
            </button>
            <button className="rounded px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              Top
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {["1d", "7d", "30d", "1y"].map((f, i) => (
              <button
                key={f}
                className={`rounded px-2 py-1 ${i === 1 ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f}
              </button>
            ))}
            <button className="ml-2 rounded border border-border px-2 py-1 text-muted-foreground">
              All Genres ▾
            </button>
            <button className="rounded border border-border px-2 py-1 text-muted-foreground">
              View All
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-12 gap-y-1 md:grid-cols-2">
          <RankColumn header items={left} startIndex={1} />
          <RankColumn header items={right} startIndex={6} />
        </div>
      </div>
    </section>
  );
}

function RankColumn({
  items,
  startIndex,
  header,
}: {
  items: typeof series;
  startIndex: number;
  header?: boolean;
}) {
  return (
    <div>
      {header && (
        <div className="grid grid-cols-[40px_1fr_80px_80px] gap-3 border-b border-border pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Rank</span>
          <span>Title</span>
          <span className="text-right">Chapters</span>
          <span className="text-right">Reads</span>
        </div>
      )}
      <ul>
        {items.map((s, i) => (
          <li
            key={s.slug}
            className="grid grid-cols-[40px_1fr_80px_80px] items-center gap-3 border-b border-border/50 py-2.5"
          >
            <span className="text-sm tabular-nums text-foreground/40">
              {String(startIndex + i).padStart(2, "0")}
            </span>
            <Link
              to="/read/$slug"
              params={{ slug: s.slug }}
              className="flex items-center gap-3 group"
            >
              <img
                src={s.cover}
                alt={s.title}
                width={48}
                height={64}
                loading="lazy"
                className="size-10 rounded object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold group-hover:text-accent">{s.title}</p>
                <p className="truncate text-[10px] text-muted-foreground">{s.romaji}</p>
              </div>
            </Link>
            <span className="text-right text-xs tabular-nums">{s.chapters}</span>
            <span className="text-right text-xs tabular-nums text-muted-foreground">
              {s.reads.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LatestUpdates() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-16">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-serif text-2xl">Latest Updates</h2>
        <Link
          to="/read"
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          View All
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {latestUpdates.map(({ series: s, updates, updatedAgo }) => (
          <div key={s.slug} className="overflow-hidden rounded-md bg-foreground text-background">
            <div className="flex">
              <img
                src={s.cover}
                alt={s.title}
                width={200}
                height={300}
                loading="lazy"
                className="h-52 w-36 shrink-0 object-cover"
              />
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-base font-bold">{s.title}</h3>
                <p className="mb-3 text-[10px] text-background/50">{s.romaji}</p>
                <ul className="space-y-1 text-[11px] text-background/80">
                  {updates.map((u) => (
                    <li key={u.ch} className="truncate">
                      <span className="font-semibold">
                        Vol. {u.vol} Ch. {u.ch}
                      </span>{" "}
                      – {u.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-background/10 px-4 py-2.5">
              <div className="flex gap-1.5">
                {s.genres.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="rounded border border-background/20 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider"
                  >
                    {g}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-background/40">Updated {updatedAgo}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentlyAdded() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-16">
      <h2 className="mb-6 font-serif text-2xl">Recently Added</h2>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-10">
        {recentlyAdded.map((m) => (
          <Link key={m.slug} to="/read/$slug" params={{ slug: m.slug }} className="group">
            <img
              src={m.cover}
              alt={m.title}
              width={200}
              height={300}
              loading="lazy"
              className="aspect-[2/3] w-full rounded object-cover ring-1 ring-border transition-transform group-hover:-translate-y-1"
            />
            <p className="mt-2 truncate text-[11px] font-semibold">{m.title}</p>
            <p className="truncate text-[10px] text-muted-foreground">{m.tags}</p>
          </Link>
        ))}
        <Link
          to="/read"
          className="group flex aspect-[2/3] flex-col items-center justify-center rounded bg-foreground text-background"
        >
          <Newspaper className="size-5" />
          <span className="mt-2 text-[11px] font-semibold">View All</span>
          <span className="text-[10px] text-background/50">975 manga</span>
        </Link>
      </div>
    </section>
  );
}

function LatestNews() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-16">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded bg-foreground text-background">
          <Newspaper className="size-4" />
        </span>
        <h2 className="font-serif text-2xl">Latest News</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <article className="relative overflow-hidden rounded">
          <img
            src={featuredNews.image}
            alt={featuredNews.title}
            width={1280}
            height={736}
            loading="lazy"
            className="h-[420px] w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-foreground/90 p-4 text-background">
            <p className="text-sm font-medium">{featuredNews.title}</p>
          </div>
        </article>
        <div className="grid gap-4">
          {sideNews.map((n) => (
            <article key={n.title} className="relative overflow-hidden rounded">
              <img
                src={n.image}
                alt={n.title}
                width={512}
                height={512}
                loading="lazy"
                className="h-32 w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-foreground/90 p-3 text-background">
                <p className="text-xs font-medium">{n.title}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
