import { createFileRoute, Link } from "@tanstack/react-router";
import { SeriesStudioCanvas } from "@/features/series/detail";

type StudioSearch = {
  chapterId?: string;
  pageId?: string;
};

export const Route = createFileRoute("/app/editor/series/$seriesId/studio")({
  head: () => ({
    meta: [
      { title: "Series Studio — MangaFlow Studio" },
      { name: "description", content: "Studio canvas (read-only) cho editor review." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): StudioSearch => ({
    chapterId: typeof search.chapterId === "string" ? search.chapterId : undefined,
    pageId: typeof search.pageId === "string" ? search.pageId : undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { seriesId } = Route.useParams();
  const { chapterId, pageId } = Route.useSearch();
  return (
    <SeriesStudioCanvas
      seriesId={seriesId}
      initialChapterId={chapterId}
      initialPageId={pageId}
      backLink={
        <Link
          to="/app/editor/review"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          ← Review Queue
        </Link>
      }
    />
  );
}
