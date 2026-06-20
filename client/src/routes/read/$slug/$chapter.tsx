import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Logo } from "@/shared/ui/site/Logo";
import { ThemeToggle } from "@/shared/ui/site/ThemeToggle";
import { publicGetChapter } from "@/shared/lib/public-api";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/read/$slug/$chapter")({
  loader: ({ params }) => {
    const r = publicGetChapter(params.slug, params.chapter);
    if (!r) throw notFound();
    return r;
  },
  notFoundComponent: () => (
    <div className="p-12 text-center text-sm text-foreground/55">Chapter not found.</div>
  ),
  component: Reader,
});

function Reader() {
  const { series, chapter, pages } = Route.useLoaderData();
  const [seen, setSeen] = useState(0);

  useEffect(() => {
    const start = Date.now();
    return () => {
      // mock metric
      const secs = Math.round((Date.now() - start) / 1000);
      try {
        const key = "mangaflow.read.metrics";
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push({ chapter: chapter.id, secs, pagesSeen: seen, at: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(prev.slice(-50)));
      } catch {}
    };
  }, [chapter.id, seen]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="flex items-center justify-between">
        <Link to="/read/$slug" params={{ slug: series.slug }}>
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <div className="mt-4 flex items-center justify-between text-[12px] text-foreground/55">
        <Link to="/read/$slug" params={{ slug: series.slug }} className="hover:text-foreground">
          ← {series.title}
        </Link>
        <span>
          {chapter.number} — {chapter.title}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {pages.map((p: (typeof pages)[number]) => (
          <img
            key={p.index}
            src={p.src}
            alt={`page ${p.index}`}
            loading="lazy"
            onLoad={() => setSeen((n) => Math.max(n, p.index))}
            className="block w-full rounded border border-foreground/10 bg-foreground/5"
          />
        ))}
      </div>

      <footer className="mt-6 flex items-center justify-between border-t border-foreground/10 pt-4 text-[12px] text-foreground/55">
        <Link to="/read/$slug" params={{ slug: series.slug }} className="hover:text-foreground">
          ← Back to chapters
        </Link>
        <span>
          You read {seen}/{pages.length} pages.
        </span>
      </footer>
    </div>
  );
}
