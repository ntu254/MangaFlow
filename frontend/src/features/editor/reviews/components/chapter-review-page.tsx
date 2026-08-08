import { useParams } from "@tanstack/react-router";
import { EmptyState } from "@/shared/ui/empty-state";
import { EditorChapterStudio } from "./editor-chapter-studio";

/**
 * Compatibility adapter for already-mounted route modules during a hot reload.
 * Editor review and annotation now share EditorChapterStudio; this component
 * deliberately reads the active route generically instead of assuming /review.
 */
export function ChapterReviewPage({
  initialAnnotationMode = false,
}: {
  initialAnnotationMode?: boolean;
}) {
  const params = useParams({ strict: false });
  const chapterId = typeof params.chapterId === "string" ? params.chapterId : undefined;

  if (!chapterId) {
    return (
      <div className="p-10">
        <EmptyState title="Chapter review not found" />
      </div>
    );
  }

  return (
    <EditorChapterStudio
      chapterId={chapterId}
      initialTool={initialAnnotationMode ? "comment" : undefined}
    />
  );
}
