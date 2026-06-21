import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageUploadPanel } from "@/features/chapters/components/PageUploadPanel";
import { PageHeader } from "@/layouts/AppShell";
import { chaptersApi } from "@/shared/api/chapters";
import { seriesApi } from "@/shared/api/series";

export const Route = createFileRoute("/app/chapters/$id/pages/upload")({
  loader: async ({ params }) => {
    try {
      const chapter = await chaptersApi.getChapter(params.id);
      const series = await seriesApi.get(chapter.seriesId);
      return { chapter, series };
    } catch {
      throw notFound();
    }
  },
  component: PageUploadPage,
});

function PageUploadPage() {
  const { chapter, series } = Route.useLoaderData();
  const chapterLabel = `Chapter ${chapter.chapterNumber}`;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={`Upload pages - ${chapterLabel}`}
        jp="Page upload"
        description={
          <Link
            to="/app/series/$id/chapters"
            params={{ id: series.id }}
            className="underline-offset-2 hover:underline"
          >
            Back to chapter
          </Link>
        }
      />
      <PageUploadPanel chapter={chapter} series={series} />
    </div>
  );
}
