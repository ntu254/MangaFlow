import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchPublicChapter,
  isPublicNotFound,
  publicAssetUrl,
} from "@/entities/reader/model/public-reader";

export const Route = createFileRoute("/read/$slug/$chapter")({
  loader: async ({ params }) => {
    try {
      return await fetchPublicChapter(params.slug, params.chapter);
    } catch (error) {
      if (isPublicNotFound(error)) throw notFound();
      throw error;
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: `Chapter ${loaderData.chapter.number} — ${loaderData.series.title}`,
          },
          {
            name: "description",
            content: `Read chapter ${loaderData.chapter.number} of ${loaderData.series.title} on beachRead.`,
          },
          {
            property: "og:title",
            content: `Chapter ${loaderData.chapter.number} — ${loaderData.series.title}`,
          },
          {
            property: "og:image",
            content: publicAssetUrl(loaderData.series.coverUrl),
          },
        ]
      : [],
  }),
  component: ChapterPage,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-serif text-4xl">Chapter not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This chapter has not been published.</p>
      <Link to="/read" className="mt-4 inline-block text-sm text-accent underline">
        Back to catalog
      </Link>
    </main>
  ),
});

function ChapterPage() {
  const { series, chapter } = Route.useLoaderData();
  const publishedNumbers = series.chapters
    .map((item) => item.number)
    .sort((left, right) => left - right);
  const currentIndex = publishedNumbers.indexOf(chapter.number);
  const previousNumber = currentIndex > 0 ? publishedNumbers[currentIndex - 1] : null;
  const nextNumber =
    currentIndex >= 0 && currentIndex < publishedNumbers.length - 1
      ? publishedNumbers[currentIndex + 1]
      : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4 text-xs">
        <Link
          to="/read/$slug"
          params={{ slug: series.slug }}
          className="text-muted-foreground hover:text-foreground"
        >
          ← {series.title}
        </Link>
        <span className="text-right font-semibold">
          Chapter {chapter.number}: {chapter.title}
        </span>
      </div>

      {chapter.pages.length > 0 ? (
        <div className="space-y-2">
          {chapter.pages.map((page, index) => (
            <img
              key={page.id}
              src={publicAssetUrl(page.imageUrl)}
              alt={`Page ${page.pageNumber || index + 1}`}
              width={page.imageWidth}
              height={page.imageHeight}
              className="h-auto w-full rounded bg-card ring-1 ring-border"
            />
          ))}
        </div>
      ) : (
        <section className="rounded-lg border border-dashed border-border px-6 py-20 text-center">
          <h2 className="font-serif text-2xl">Pages unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The chapter is published, but its page assets are not available.
          </p>
        </section>
      )}

      <nav className="mt-10 flex items-center justify-between">
        {previousNumber ? (
          <Link
            to="/read/$slug/$chapter"
            params={{ slug: series.slug, chapter: String(previousNumber) }}
            className="inline-flex items-center gap-1 rounded border border-border px-4 py-2 text-xs"
          >
            <ChevronLeft className="size-3.5" /> Chapter {previousNumber}
          </Link>
        ) : (
          <span />
        )}
        {nextNumber ? (
          <Link
            to="/read/$slug/$chapter"
            params={{ slug: series.slug, chapter: String(nextNumber) }}
            className="inline-flex items-center gap-1 rounded bg-foreground px-4 py-2 text-xs text-background"
          >
            Chapter {nextNumber} <ChevronRight className="size-3.5" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
