import { createFileRoute } from "@tanstack/react-router";
import { EditorChapterStudio } from "@/features/editor/reviews";

export const Route = createFileRoute("/app/editor/chapters/$chapterId/annotate")({
  head: () => ({ meta: [{ title: "Annotate Chapter — MangaFlow Studio" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { chapterId } = Route.useParams();
  return <EditorChapterStudio chapterId={chapterId} initialTool="comment" />;
}
