import { createFileRoute } from "@tanstack/react-router";
import { PageStudioWorkspace } from "@/features/page-studio/PageStudioWorkspace";

export const Route = createFileRoute("/app/pages/$id/studio")({
  validateSearch: (search: Record<string, unknown>) => {
    return { seriesId: search.seriesId as string | undefined };
  },
  loader: ({ params }) => {
    return { pageId: params.id };
  },
  component: PageStudio,
});

function PageStudio() {
  const { pageId } = Route.useLoaderData();
  const { seriesId } = Route.useSearch();

  return <PageStudioWorkspace pageId={pageId} seriesId={seriesId} />;
}
