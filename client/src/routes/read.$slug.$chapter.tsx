import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { findSeries } from "@/lib/mock/manga";

export const Route = createFileRoute("/read/$slug/$chapter")({
  loader: ({ params }) => {
    const s = findSeries(params.slug);
    if (!s) throw notFound();
    const ch = parseInt(params.chapter, 10);
    if (!Number.isFinite(ch) || ch < 1 || ch > s.chapters) throw notFound();
    return { series: s, chapter: ch };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `Chapter ${loaderData.chapter} — ${loaderData.series.title}` },
          {
            name: "description",
            content: `Đọc chương ${loaderData.chapter} của ${loaderData.series.title} trên beachRead.`,
          },
          {
            property: "og:title",
            content: `Chapter ${loaderData.chapter} — ${loaderData.series.title}`,
          },
          {
            property: "og:description",
            content: `Đọc chương ${loaderData.chapter} của ${loaderData.series.title}.`,
          },
          { property: "og:image", content: loaderData.series.cover },
        ]
      : [],
  }),
  component: ChapterPage,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-serif text-4xl">Chapter không tồn tại</h1>
      <Link to="/read" className="mt-4 inline-block text-sm text-accent underline">
        Quay lại catalog
      </Link>
    </main>
  ),
  errorComponent: ({ reset }) => (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-serif text-3xl">Không tải được chapter.</h1>
      <button
        onClick={reset}
        className="mt-4 rounded bg-foreground px-4 py-2 text-xs text-background"
      >
        Thử lại
      </button>
    </main>
  ),
});

function ChapterPage() {
  const { series, chapter } = Route.useLoaderData();
  const prev = chapter > 1 ? chapter - 1 : null;
  const next = chapter < series.chapters ? chapter + 1 : null;
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between text-xs">
        <Link
          to="/read/$slug"
          params={{ slug: series.slug }}
          className="text-muted-foreground hover:text-foreground"
        >
          ← {series.title}
        </Link>
        <span className="font-semibold">Chapter {chapter}</span>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid aspect-[2/3] w-full place-items-center rounded border border-dashed border-border bg-card text-muted-foreground"
          >
            <div className="text-center">
              <p className="font-serif text-2xl">Page {i + 1}</p>
              <p className="mt-1 text-[11px]">
                Reader page placeholder — phase sau sẽ wire ảnh thật từ Lovable Cloud storage.
              </p>
            </div>
          </div>
        ))}
      </div>
      <nav className="mt-10 flex items-center justify-between">
        {prev ? (
          <Link
            to="/read/$slug/$chapter"
            params={{ slug: series.slug, chapter: String(prev) }}
            className="inline-flex items-center gap-1 rounded border border-border px-4 py-2 text-xs"
          >
            <ChevronLeft className="size-3.5" /> Chapter {prev}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to="/read/$slug/$chapter"
            params={{ slug: series.slug, chapter: String(next) }}
            className="inline-flex items-center gap-1 rounded bg-foreground px-4 py-2 text-xs text-background"
          >
            Chapter {next} <ChevronRight className="size-3.5" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
