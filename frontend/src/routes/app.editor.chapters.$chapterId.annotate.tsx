import { createFileRoute } from "@tanstack/react-router";
import { EditorAnnotationStudio } from "@/features/editor/annotation-studio";

export const Route = createFileRoute("/app/editor/chapters/$chapterId/annotate")({
  head: () => ({ meta: [{ title: "Annotation Studio — MangaFlow Studio" }] }),
  component: EditorAnnotationStudio,
});
