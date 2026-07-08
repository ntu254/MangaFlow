import { createFileRoute } from "@tanstack/react-router";
import { EditorAnnotationStudio } from "@/features/editor/annotation-studio";

export const Route = createFileRoute("/app/editor/chapters/$chapterId/annotate")({
  head: () => ({ meta: [{ title: "Annotation Studio — beachRead Studio" }] }),
  component: EditorAnnotationStudio,
});
