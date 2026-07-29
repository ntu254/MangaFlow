import { createFileRoute, Link } from "@tanstack/react-router";
import { SeriesDetailPage } from "@/features/series/detail";

const seriesTabSchema = [
  "overview",
  "proposal",
  "chapters",
  "materials",
  "rankings",
  "calendar",
  "team",
] as const;

export type SeriesTab = (typeof seriesTabSchema)[number];

export const Route = createFileRoute("/app/series/$slug/$tab")({
  loader: ({ params }) => {
    const tab = seriesTabSchema.includes(params.tab as SeriesTab)
      ? (params.tab as SeriesTab)
      : ("overview" as SeriesTab);
    return { slug: params.slug, tab };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl py-16 text-center">
      <h1 className="font-serif text-3xl">Page not found</h1>
      <Link to="/app/series" className="mt-4 inline-block text-xs text-accent underline">
        Back to series list
      </Link>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="mx-auto max-w-3xl py-16 text-center">
      <h1 className="font-serif text-3xl">Error loading page</h1>
      <button
        onClick={reset}
        className="mt-4 rounded bg-foreground px-3 py-1.5 text-xs text-background"
      >
        Try again
      </button>
    </div>
  ),
  component: function SeriesDetailRoute() {
    const { slug, tab } = Route.useLoaderData();
    return <SeriesDetailPage slug={slug} tab={tab} />;
  },
});
